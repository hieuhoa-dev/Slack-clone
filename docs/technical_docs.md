# Tài Liệu Kỹ Thuật - Slack Clone

## Tổng Quan Dự Án

### Mô Tả
Slack Clone là một ứng dụng nhắn tin thời gian thực được xây dựng bằng Next.js và Convex, mô phỏng các tính năng chính của Slack bao gồm workspace, channel, tin nhắn trực tiếp, reactions và thread.

### Công Nghệ Sử Dụng
- **Framework**: Next.js 15.4.6 (React 19.1.0)
- **Backend**: Convex (Real-time Database & API)
- **Authentication**: Convex Auth với GitHub, Google và Password providers
- **Styling**: Tailwind CSS với Radix UI components
- **State Management**: Jotai, Zustand (thông qua custom hooks)
- **Rich Text Editor**: Quill.js
- **Notifications**: Sonner
- **Icons**: Lucide React, React Icons
- **Date Handling**: date-fns
- **TypeScript**: Đầy đủ type safety

## Kiến Trúc Hệ Thống

### 1. Database Schema (Convex)

#### Tables Structure:

**Users Table (Auth)**
- Được quản lý bởi Convex Auth
- Chứa thông tin user cơ bản: email, name, image

**Workspaces Table**
```typescript
{
  name: string,
  userId: Id<"users">,      // Owner của workspace
  joinCode: string          // Mã tham gia workspace (6 ký tự)
}
```

**Members Table**
```typescript
{
  userId: Id<"users">,
  workspaceId: Id<"workspaces">,
  role: "admin" | "member"
}
```
- Indexes: by_user_id, by_workspace_id, by_workspace_id_user_id

**Channels Table**
```typescript
{
  name: string,
  workspaceId: Id<"workspaces">
}
```
- Index: by_workspace_id

**Conversations Table**
```typescript
{
  workspaceId: Id<"workspaces">,
  memberOneId: Id<"members">,
  memberTwoId: Id<"members">
}
```
- Index: by_workspace_id

**Messages Table**
```typescript
{
  body: string,                              // Rich text content (JSON)
  image?: Id<"_storage">,                   // File upload reference
  memberId: Id<"members">,                  // Người gửi
  workspaceId: Id<"workspaces">,            // Workspace chứa message
  channelId?: Id<"channels">,               // Channel (nếu là channel message)
  parentMessageId?: Id<"messages">,         // Parent message (cho threads)
  conversationId?: Id<"conversations">,     // Conversation (nếu là DM)
  updatedAt?: number                        // Timestamp khi edit
}
```
- Indexes: by_workspace_id, by_member_id, by_channel_id, by_parent_message_id, by_channel_id_parent_conversation_id

**Reactions Table**
```typescript
{
  workspaceId: Id<"workspaces">,
  memberId: Id<"members">,
  messageId: Id<"messages">,
  value: string                            // Emoji value
}
```
- Indexes: by_workspace_id, by_message_id, by_member_id

### 2. Authentication System

#### Providers
- **Password Authentication**: Email/password với profile customization
- **OAuth Providers**: GitHub và Google
- **Session Management**: Convex Auth tự động xử lý

#### Flow
1. User truy cập `/auth`
2. Chọn phương thức đăng nhập (email/password, GitHub, Google)
3. Sau khi authenticated, redirect về workspace hoặc trang chính
4. User information được lưu trong Convex users table

#### Components
- `AuthScreen`: Container cho sign-in/sign-up
- `SignInCard`: Form đăng nhập
- `SignUpCard`: Form đăng ký
- `UserButton`: Dropdown với user actions

### 3. Workspace Management

#### Core Functions
- **Create Workspace**: Tạo workspace mới với random join code
- **Join Workspace**: Tham gia bằng join code
- **Workspace Switching**: Chuyển đổi giữa các workspace
- **Member Management**: Quản lý thành viên và roles

#### Security
- Chỉ admin có thể:
  - Update workspace name
  - Generate new join code
  - Delete workspace (cascade delete tất cả related data)
- Member access control được enforce ở Convex mutations/queries

### 4. Channel System

#### Features
- **Channel Creation**: Tạo channel trong workspace
- **Auto-created Channels**: "general" channel được tạo tự động khi tạo workspace
- **Channel Messages**: Thread messages trong channel
- **Channel Navigation**: Sidebar navigation với active state

#### Implementation
- Channel messages được filter bằng `channelId` và `parentMessageId = null`
- Real-time updates thông qua Convex subscriptions

### 5. Direct Messages (Conversations)

#### Logic
- Conversation được tạo tự động giữa hai members
- Unique constraint: một cặp members chỉ có một conversation
- Conversation messages được filter bằng `conversationId`

### 6. Messaging System

#### Message Types
- **Text Messages**: Rich text với Quill.js
- **Image Messages**: Upload qua Convex file storage
- **Thread Replies**: Messages với `parentMessageId`

#### Real-time Features
- **Live Updates**: Messages xuất hiện real-time
- **Typing Indicators**: (Có thể implement với Convex presence)
- **Message Status**: Sent, delivered states

#### Message Operations
- **Send**: Create với validation
- **Edit**: Update body + updatedAt timestamp
- **Delete**: Remove message (có thể soft delete)
- **Thread**: Reply với parent reference

### 7. Reactions System

#### Implementation
- Mỗi reaction là một record riêng biệt
- Group reactions by value và count
- Show member names in reaction tooltip
- Toggle reactions (add/remove)

#### Data Processing
```typescript
// Dedupe và aggregate reactions
const dedupedReactions = reactions.reduce((acc, reaction) => {
  const existing = acc.find(r => r.value === reaction.value);
  if (existing) {
    existing.memberIds.push(reaction.memberId);
  } else {
    acc.push({...reaction, memberIds: [reaction.memberId]});
  }
  return acc;
}, []);
```

## Frontend Architecture

### 1. Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── auth/                    # Auth pages
│   ├── join/[workspaceId]/      # Join workspace flow
│   └── workspace/[workspaceId]/ # Main app interface
├── components/                   # Shared UI components
│   ├── ui/                      # Radix UI components
│   ├── message-list.tsx         # Message display
│   ├── editor.tsx               # Rich text editor
│   └── reactions.tsx            # Reaction system
├── features/                     # Feature-based organization
│   ├── auth/                    # Authentication
│   ├── workspaces/              # Workspace management
│   ├── channels/                # Channel operations
│   ├── members/                 # Member management
│   ├── messages/                # Messaging
│   └── reactions/               # Reaction system
├── hooks/                        # Custom React hooks
└── lib/                          # Utilities
```

### 2. State Management

#### Custom Hooks Pattern
Mỗi feature có structure:
```
features/[feature]/
├── api/                         # Convex queries/mutations
│   ├── use-get-[resource].ts   # Fetch data
│   ├── use-create-[resource].ts # Create operations
│   └── use-update-[resource].ts # Update operations
├── components/                  # Feature components
├── store/                       # Local state (Zustand)
└── types.ts                     # TypeScript definitions
```

#### Example API Hook
```typescript
export const useCreateWorkspace = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  
  const mutation = useMutation(api.workspaces.create);
  
  const mutate = useCallback(async (values, options) => {
    // Handle mutation with loading states
  }, [mutation]);
  
  return { mutate, data, error, isPending, isSuccess, isError };
};
```

### 3. Real-time Updates

#### Convex Subscriptions
```typescript
// Auto re-render khi data thay đổi
const messages = useQuery(api.messages.get, {
  channelId,
  conversationId,
  paginationOpts
});
```

#### Optimistic Updates
- UI cập nhật ngay lập tức
- Revert nếu mutation fails
- Smooth user experience

### 4. Message List Implementation

#### Features
- **Infinite Scroll**: Load more messages khi scroll top
- **Date Grouping**: Group messages theo ngày
- **Message Compacting**: Compact consecutive messages từ cùng user
- **Thread Preview**: Show thread count và latest reply

#### Virtual Scrolling
```typescript
// Intersection Observer for pagination
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting && canLoadMore) {
    loadMore();
  }
}, { threshold: 1.0 });
```

### 5. Rich Text Editor

#### Quill.js Integration
- **Toolbar**: Bold, italic, strike, lists, links
- **Keyboard Shortcuts**: 
  - Enter: Send message
  - Shift+Enter: New line
- **Emoji Support**: Emoji picker integration
- **Image Upload**: Drag & drop, file picker

#### Implementation Details
```typescript
const options: QuillOptions = {
  theme: "snow",
  modules: {
    toolbar: [["bold", "italic", "strike"], ["link"], [...]],
    keyboard: {
      bindings: {
        enter: { key: "Enter", handler: sendMessage },
        shift_enter: { key: "Enter", shiftKey: true, handler: newLine }
      }
    }
  }
};
```

## API Design

### 1. Convex Mutations

#### Authentication Required
Tất cả mutations đều require authentication:
```typescript
const userId = await auth.getUserId(ctx);
if (!userId) throw new Error("Unauthorized");
```

#### Authorization Patterns
```typescript
// Admin-only operations
const member = await getMember(ctx, workspaceId, userId);
if (!member || member.role !== "admin") {
  throw new Error("Unauthorized");
}

// Owner-only operations  
if (message.memberId !== member._id) {
  throw new Error("Unauthorized");
}
```

### 2. Query Optimization

#### Indexes Usage
- Sử dụng compound indexes cho complex queries
- Efficient filtering và sorting
- Minimal data fetching

#### Pagination
```typescript
export const getMessages = query({
  args: { 
    channelId: v.optional(v.id("channels")),
    paginationOpts: paginationOptsValidator 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_channel_id", q => q.eq("channelId", args.channelId))
      .order("desc")
      .paginate(args.paginationOpts);
  }
});
```

### 3. File Upload

#### Convex Storage
- Images upload qua Convex file storage
- Generate URLs cho display
- Automatic cleanup khi delete messages

## UI/UX Design

### 1. Design System

#### Colors
- Primary: Slack-inspired purple (#5C3B58)
- Success: Green (#007a5a)
- Background: White với subtle grays
- Border: Light gray với focus states

#### Typography
- Font: Geist Sans/Mono
- Sizes: Responsive typography scale
- Weight: Regular, medium, semibold

### 2. Component Library

#### Radix UI Integration
- **Dialog**: Modals cho workspace creation, settings
- **Dropdown Menu**: User menu, workspace switcher
- **Avatar**: User avatars với fallbacks
- **Tooltip**: Hover hints
- **Popover**: Emoji picker, reactions

#### Custom Components
- **Hint**: Tooltip wrapper
- **Editor**: Rich text input
- **Message**: Complex message display
- **MessageList**: Virtualized message list

### 3. Responsive Design

#### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

#### Layout
- **Sidebar**: Collapsible trên mobile
- **Main Content**: Flexible width
- **Panel**: Right panel cho threads (desktop only)

## Performance Optimization

### 1. React Optimizations

#### Memoization
```typescript
const MemoizedMessage = memo(Message, (prev, next) => {
  return prev.id === next.id && prev.isEditing === next.isEditing;
});
```

#### Lazy Loading
- Dynamic imports cho heavy components
- Code splitting theo routes
- Lazy load emoji picker

### 2. Database Performance

#### Efficient Queries
- Use appropriate indexes
- Limit data fetching
- Pagination cho large datasets

#### Real-time Optimization
- Subscribe chỉ necessary data
- Unsubscribe khi unmount
- Debounce user actions

### 3. Bundle Optimization

#### Next.js Features
- Automatic code splitting
- Image optimization
- Font optimization
- Tree shaking

## Security

### 1. Authentication Security

#### Session Management
- Secure HTTP-only cookies
- CSRF protection
- Session expiration

#### OAuth Security  
- Proper redirect URI validation
- State parameter validation
- Secure token exchange

### 2. Authorization

#### Row-Level Security
```typescript
// Chỉ members của workspace mới access được data
const member = await getMember(ctx, workspaceId, userId);
if (!member) return null;
```

#### Input Validation
- Convex validators cho tất cả inputs
- XSS protection trong rich text
- File upload validation

### 3. Data Protection

#### Sensitive Data
- Không log sensitive information
- Secure file storage
- Privacy-focused data handling

## Deployment

### 1. Environment Setup

#### Environment Variables
```env
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

### 2. Build Process

#### Production Build
```bash
npm run build    # Next.js production build
npx convex deploy # Deploy Convex functions
```

#### Deployment Platforms
- **Frontend**: Vercel, Netlify
- **Backend**: Convex (managed)
- **File Storage**: Convex Storage

### 3. Monitoring

#### Error Tracking
- Console error monitoring
- Convex function error tracking
- User action logging

#### Performance Monitoring
- Core Web Vitals
- API response times
- Real-time connection health

## Development Guidelines

### 1. Code Standards

#### TypeScript
- Strict type checking
- Interface definitions cho all props
- Generic types cho reusable components

#### ESLint Configuration
- Next.js recommended rules
- Custom rules cho code consistency
- Import sorting và organization

### 2. Testing Strategy

#### Unit Tests
- Component testing với React Testing Library
- Hook testing
- Utility function testing

#### Integration Tests  
- API endpoint testing
- User flow testing
- Real-time functionality testing

### 3. Git Workflow

#### Branch Strategy
- `main`: Production code
- `develop`: Integration branch
- Feature branches: `feature/[feature-name]`

#### Commit Messages
- Conventional commits format
- Clear, descriptive messages
- Reference issue numbers

## Troubleshooting

### 1. Common Issues

#### Authentication Problems
- Check environment variables
- Verify OAuth app configuration
- Clear browser cookies/storage

#### Real-time Connection Issues
- Check Convex deployment status  
- Verify network connectivity
- Monitor WebSocket connections

### 2. Debug Tools

#### Development
- React DevTools
- Convex Dashboard
- Browser Network tab

#### Production
- Convex logs
- Error monitoring services
- Performance profiling

## Future Enhancements

### 1. Planned Features

#### Core Features
- Voice/Video calling
- File sharing (documents, etc.)
- Advanced search functionality
- Message formatting (code blocks, mentions)

#### Advanced Features  
- Workflow automation
- Integration với external services
- Advanced admin controls
- Analytics dashboard

### 2. Technical Improvements

#### Performance
- Service Worker implementation
- Offline functionality
- Advanced caching strategies

#### Developer Experience
- Better error handling
- Improved logging
- Development tools

## Kết Luận

Slack Clone project thể hiện một ứng dụng modern web application với:

- **Scalable Architecture**: Clean separation of concerns
- **Real-time Capabilities**: Instant messaging và updates  
- **Type Safety**: Full TypeScript integration
- **Modern Stack**: Latest React/Next.js features
- **Production Ready**: Security, performance, monitoring

Dự án này có thể serve như foundation cho các messaging applications phức tạp hơn và có thể mở rộng để support enterprise-level features.