import {renderHook, act} from '@testing-library/react';
import {api} from '../../convex/_generated/api';
import {useQuery, useMutation, usePaginatedQuery} from 'convex/react';
import {Id} from '../../convex/_generated/dataModel';

import {useCreateMessage} from '@/features/messages/api/use-create-message';
import {useGetMessages} from '@/features/messages/api/use-get-messages';
import {useGetMessage} from '@/features/messages/api/use-get-message';
import {useUpdateMessage} from '@/features/messages/api/use-update-message';
import {useRemoveMessage} from '@/features/messages/api/use-remove-message';

// Mock convex/react
jest.mock('convex/react', () => ({
    useQuery: jest.fn(),
    useMutation: jest.fn(),
    usePaginatedQuery: jest.fn(),
}));


describe('useCreateMessage', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();

    const mockMessageId = 'message_123' as Id<"messages">;
    const mockWorkspaceId = 'workspace_123' as Id<"workspaces">;
    const mockChannelId = 'channel_456' as Id<"channels">;
    const mockConversationId = 'conversation_789' as Id<"conversations">;
    const mockImageId = 'image_123' as Id<"_storage">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useCreateMessage());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.messages.create);
    });

    it('should create message in channel successfully', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockMessageId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateMessage());

        await act(async () => {
            await result.current.mutate({
                body: 'Hello world!',
                workspaceId: mockWorkspaceId,
                channelId: mockChannelId
            }, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            body: 'Hello world!',
            workspaceId: mockWorkspaceId,
            channelId: mockChannelId
        });
        expect(onSuccess).toHaveBeenCalledWith(mockMessageId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should create message in conversation successfully', async () => {
        // Arrange
        const conversationMessageId = 'message_456' as Id<"messages">;
        mockMutationFn.mockResolvedValue(conversationMessageId);

        // Act
        const {result} = renderHook(() => useCreateMessage());

        await act(async () => {
            await result.current.mutate({
                body: 'Direct message',
                workspaceId: mockWorkspaceId,
                conversationId: mockConversationId
            });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            body: 'Direct message',
            workspaceId: mockWorkspaceId,
            conversationId: mockConversationId
        });
        expect(result.current.isSettled).toBe(true);
    });

    it('should create thread message successfully', async () => {
        // Arrange
        const threadMessageId = 'thread_message_123' as Id<"messages">;
        mockMutationFn.mockResolvedValue(threadMessageId);
        const parentMessageId = 'parent_message_123' as Id<"messages">;

        // Act
        const {result} = renderHook(() => useCreateMessage());

        await act(async () => {
            await result.current.mutate({
                body: 'Thread reply',
                workspaceId: mockWorkspaceId,
                channelId: mockChannelId,
                parentMessageId: parentMessageId
            });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            body: 'Thread reply',
            workspaceId: mockWorkspaceId,
            channelId: mockChannelId,
            parentMessageId: parentMessageId
        });
        expect(result.current.isSettled).toBe(true);
    });

    it('should create message with image successfully', async () => {
        // Arrange
        const messageWithImageId = 'message_with_image' as Id<"messages">;
        mockMutationFn.mockResolvedValue(messageWithImageId);

        // Act
        const {result} = renderHook(() => useCreateMessage());

        await act(async () => {
            await result.current.mutate({
                body: 'Check this out!',
                image: mockImageId,
                workspaceId: mockWorkspaceId,
                channelId: mockChannelId
            });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            body: 'Check this out!',
            image: mockImageId,
            workspaceId: mockWorkspaceId,
            channelId: mockChannelId
        });
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to create empty message', async () => {
        // Arrange
        const mockError = new Error('Message body is required');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateMessage());

        await act(async () => {
            await result.current.mutate({
                body: '',
                workspaceId: mockWorkspaceId,
                channelId: mockChannelId
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to create message in non-existent channel', async () => {
        // Arrange
        const mockError = new Error('Channel not found');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useCreateMessage());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    body: 'Message',
                    workspaceId: mockWorkspaceId,
                    channelId: 'non_existent_channel' as Id<"channels">
                }, { throwError: true })
            ).rejects.toThrow('Channel not found');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to create message by non-member', async () => {
        // Arrange
        const mockError = new Error('Not a member of this workspace');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useCreateMessage());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    body: 'Unauthorized message',
                    workspaceId: 'restricted_workspace' as Id<"workspaces">,
                    channelId: mockChannelId
                }, { throwError: true })
            ).rejects.toThrow('Not a member of this workspace');
        });
    });

    it('should validate message length', async () => {
        // Arrange
        const longMessage = 'A'.repeat(5001); // Assuming 5000 char limit
        const mockError = new Error('Message too long');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateMessage());

        await act(async () => {
            await result.current.mutate({
                body: longMessage,
                workspaceId: mockWorkspaceId,
                channelId: mockChannelId
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });
});

describe('useGetMessages', () => {
    const mockUsePaginatedQuery = usePaginatedQuery as jest.MockedFunction<typeof usePaginatedQuery>;
    const mockChannelId = 'channel_456' as Id<"channels">;
    const mockConversationId = 'conversation_789' as Id<"conversations">;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return messages for channel with pagination', () => {
        // Arrange
        const mockMessages = [
            {
                _id: 'msg_1' as Id<"messages">,
                body: 'Hello!',
                memberId: 'member_1' as Id<"members">,
                workspaceId: 'workspace_123' as Id<"workspaces">,
                channelId: mockChannelId,
                _creationTime: Date.now()
            },
            {
                _id: 'msg_2' as Id<"messages">,
                body: 'How are you?',
                memberId: 'member_2' as Id<"members">,
                workspaceId: 'workspace_123' as Id<"workspaces">,
                channelId: mockChannelId,
                _creationTime: Date.now() - 1000
            }
        ];

        const mockLoadMore = jest.fn();
        mockUsePaginatedQuery.mockReturnValue({
            results: mockMessages,
            status: 'CanLoadMore',
            isLoading: false,
            loadMore: mockLoadMore
        });

        // Act
        const {result} = renderHook(() => useGetMessages({channelId: mockChannelId}));

        // Assert
        expect(result.current.results).toEqual(mockMessages);
        expect(result.current.status).toBe('CanLoadMore');
        expect(typeof result.current.loadMore).toBe('function');
        expect(mockUsePaginatedQuery).toHaveBeenCalledWith(
            api.messages.get,
            {channelId: mockChannelId, conversationId: undefined, parentMessageId: undefined},
            {initialNumItems: 5}
        );
    });

    it('should return messages for conversation', () => {
        // Arrange
        const mockMessages = [
            {
                _id: 'dm_1' as Id<"messages">,
                body: 'Direct message',
                memberId: 'member_1' as Id<"members">,
                workspaceId: 'workspace_123' as Id<"workspaces">,
                conversationId: mockConversationId,
                _creationTime: Date.now()
            }
        ];

        mockUsePaginatedQuery.mockReturnValue({
            results: mockMessages,
            status: 'Exhausted',
            isLoading: false,
            loadMore: jest.fn()
        });

        // Act
        const {result} = renderHook(() => useGetMessages({conversationId: mockConversationId}));

        // Assert
        expect(result.current.results).toEqual(mockMessages);
        expect(result.current.status).toBe('Exhausted');
        expect(mockUsePaginatedQuery).toHaveBeenCalledWith(
            api.messages.get,
            {channelId: undefined, conversationId: mockConversationId, parentMessageId: undefined},
            {initialNumItems: 5}
        );
    });

    it('should return empty array when no messages', () => {
        // Arrange
        mockUsePaginatedQuery.mockReturnValue({
            results: [],
            status: 'Exhausted',
            isLoading: false,
            loadMore: jest.fn()
        });

        // Act
        const {result} = renderHook(() => useGetMessages({channelId: 'empty_channel' as Id<"channels">}));

        // Assert
        expect(result.current.results).toHaveLength(0);
        expect(result.current.status).toBe('Exhausted');
    });

    it('should handle loading state', () => {
        // Arrange
        mockUsePaginatedQuery.mockReturnValue({
            results: [],
            status: 'LoadingFirstPage',
            isLoading: true,
            loadMore: jest.fn()
        });

        // Act
        const {result} = renderHook(() => useGetMessages({channelId: mockChannelId}));

        // Assert
        expect(result.current.results).toEqual([]);
        expect(result.current.status).toBe('LoadingFirstPage');
    });

    it('should handle load more functionality', () => {
        // Arrange
        const mockLoadMore = jest.fn();
        mockUsePaginatedQuery.mockReturnValue({
            results: [],
            status: 'CanLoadMore',
            isLoading: false,
            loadMore: mockLoadMore
        });

        // Act
        const {result} = renderHook(() => useGetMessages({channelId: mockChannelId}));
        result.current.loadMore();

        // Assert
        expect(mockLoadMore).toHaveBeenCalledWith(5); // BATCH_SIZE
    });

    it('should handle thread messages', () => {
        // Arrange
        const parentMessageId = 'parent_123' as Id<"messages">;
        const threadMessages = [
            {
                _id: 'thread_1' as Id<"messages">,
                body: 'Thread reply',
                memberId: 'member_1' as Id<"members">,
                workspaceId: 'workspace_123' as Id<"workspaces">,
                channelId: mockChannelId,
                parentMessageId: parentMessageId,
                _creationTime: Date.now()
            }
        ];

        mockUsePaginatedQuery.mockReturnValue({
            results: threadMessages,
            status: 'Exhausted',
            isLoading: false,
            loadMore: jest.fn()
        });

        // Act
        const {result} = renderHook(() => useGetMessages({
            channelId: mockChannelId,
            parentMessageId: parentMessageId
        }));

        // Assert
        expect(result.current.results).toEqual(threadMessages);
        expect(mockUsePaginatedQuery).toHaveBeenCalledWith(
            api.messages.get,
            {channelId: mockChannelId, conversationId: undefined, parentMessageId: parentMessageId},
            {initialNumItems: 5}
        );
    });
});

describe('useGetMessage', () => {
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
    const mockMessageId = 'message_123' as Id<"messages">;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return message details by ID', () => {
        // Arrange
        const mockMessage = {
            _id: mockMessageId,
            body: 'Test message',
            memberId: 'member_123' as Id<"members">,
            workspaceId: 'workspace_123' as Id<"workspaces">,
            channelId: 'channel_456' as Id<"channels">,
            _creationTime: Date.now()
        };

        mockUseQuery.mockReturnValue(mockMessage);

        // Act
        const {result} = renderHook(() => useGetMessage({id: mockMessageId}));

        // Assert
        expect(result.current.data).toEqual(mockMessage);
        expect(result.current.isLoading).toBe(false);
        expect(mockUseQuery).toHaveBeenCalledWith(api.messages.getById, {id: mockMessageId});
    });

    it('should return null for non-existent message', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useGetMessage({id: 'non_existent' as Id<"messages">}));

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should show loading state when data is undefined', () => {
        // Arrange
        mockUseQuery.mockReturnValue(undefined);

        // Act
        const {result} = renderHook(() => useGetMessage({id: mockMessageId}));

        // Assert
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });

    it('should return null when user has no access to message', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useGetMessage({id: 'restricted_message' as Id<"messages">}));

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should return message with image', () => {
        // Arrange
        const mockMessage = {
            _id: 'message_with_image' as Id<"messages">,
            body: 'Check this!',
            image: 'image_123' as Id<"_storage">,
            memberId: 'member_123' as Id<"members">,
            workspaceId: 'workspace_123' as Id<"workspaces">,
            channelId: 'channel_456' as Id<"channels">,
            _creationTime: Date.now()
        };

        mockUseQuery.mockReturnValue(mockMessage);

        // Act
        const {result} = renderHook(() => useGetMessage({id: 'message_with_image' as Id<"messages">}));

        // Assert
        expect(result.current.data).toEqual(mockMessage);
        expect(result.current.data?.image).toBe('image_123');
        expect(result.current.isLoading).toBe(false);
    });

    it('should return thread message with parent', () => {
        // Arrange
        const mockMessage = {
            _id: 'thread_message' as Id<"messages">,
            body: 'Thread reply',
            memberId: 'member_123' as Id<"members">,
            workspaceId: 'workspace_123' as Id<"workspaces">,
            channelId: 'channel_456' as Id<"channels">,
            parentMessageId: 'parent_123' as Id<"messages">,
            _creationTime: Date.now()
        };

        mockUseQuery.mockReturnValue(mockMessage);

        // Act
        const {result} = renderHook(() => useGetMessage({id: 'thread_message' as Id<"messages">}));

        // Assert
        expect(result.current.data).toEqual(mockMessage);
        expect(result.current.data?.parentMessageId).toBe('parent_123');
    });
});

describe('useUpdateMessage', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();
    const mockMessageId = 'message_123' as Id<"messages">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useUpdateMessage());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.messages.update);
    });

    it('should update message successfully by author', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockMessageId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateMessage());

        await act(async () => {
            await result.current.mutate({
                id: mockMessageId,
                body: 'Updated message'
            }, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            id: mockMessageId,
            body: 'Updated message'
        });
        expect(onSuccess).toHaveBeenCalledWith(mockMessageId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to update message by non-author', async () => {
        // Arrange
        const mockError = new Error('Only message author can update');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateMessage());

        await act(async () => {
            await result.current.mutate({
                id: mockMessageId,
                body: 'Unauthorized update'
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to update non-existent message', async () => {
        // Arrange
        const mockError = new Error('Message not found');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useUpdateMessage());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: 'non_existent' as Id<"messages">,
                    body: 'Update attempt'
                }, { throwError: true })
            ).rejects.toThrow('Message not found');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to update with empty body', async () => {
        // Arrange
        const mockError = new Error('Message body is required');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useUpdateMessage());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: mockMessageId,
                    body: ''
                }, { throwError: true })
            ).rejects.toThrow('Message body is required');
        });
    });

    it('should validate update time limit', async () => {
        // Arrange
        const mockError = new Error('Message edit time expired');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateMessage());

        await act(async () => {
            await result.current.mutate({
                id: 'old_message' as Id<"messages">,
                body: 'Late update'
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });
});

describe('useRemoveMessage', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();
    const mockMessageId = 'message_123' as Id<"messages">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useRemoveMessage());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.messages.remove);
    });

    it('should remove message successfully by author', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockMessageId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useRemoveMessage());

        await act(async () => {
            await result.current.mutate({id: mockMessageId}, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({id: mockMessageId});
        expect(onSuccess).toHaveBeenCalledWith(mockMessageId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to remove message by non-author', async () => {
        // Arrange
        const mockError = new Error('Only message author can delete');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useRemoveMessage());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({id: mockMessageId}, { throwError: true })
            ).rejects.toThrow('Only message author can delete');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should allow admin to remove any message', async () => {
        // Arrange
        const messageId = 'message_by_member' as Id<"messages">;
        mockMutationFn.mockResolvedValue(messageId);

        // Act
        const {result} = renderHook(() => useRemoveMessage());

        await act(async () => {
            await result.current.mutate({id: messageId});
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({id: messageId});
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to remove non-existent message', async () => {
        // Arrange
        const mockError = new Error('Message not found');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useRemoveMessage());

        await act(async () => {
            await result.current.mutate({id: 'non_existent' as Id<"messages">}, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle cascade removal of thread messages', async () => {
        // Arrange
        const parentMessageId = 'parent_message' as Id<"messages">;
        mockMutationFn.mockResolvedValue(parentMessageId);
        const onSettled = jest.fn();

        // Act
        const {result} = renderHook(() => useRemoveMessage());

        await act(async () => {
            await result.current.mutate({id: parentMessageId}, { onSettled });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({id: parentMessageId});
        expect(onSettled).toHaveBeenCalled();
        expect(result.current.isSettled).toBe(true);
    });
});

describe('Message Management Integration Tests', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
    const mockUsePaginatedQuery = usePaginatedQuery as jest.MockedFunction<typeof usePaginatedQuery>;
    const mockMutationFn = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should handle network errors gracefully', async () => {
        // Arrange
        const networkError = new Error('Network error');
        mockMutationFn.mockRejectedValue(networkError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateMessage());

        await act(async () => {
            await result.current.mutate({
                body: 'Test message',
                workspaceId: 'workspace_123' as Id<"workspaces">,
                channelId: 'channel_456' as Id<"channels">
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(networkError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle database errors', async () => {
        // Arrange
        const databaseError = new Error('Database connection failed');
        mockMutationFn.mockRejectedValue(databaseError);

        // Act
        const {result} = renderHook(() => useUpdateMessage());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: 'message_123' as Id<"messages">,
                    body: 'Update attempt'
                }, { throwError: true })
            ).rejects.toThrow('Database connection failed');
        });
    });

    it('should handle authentication errors in queries', () => {
        // Arrange
        mockUseQuery.mockImplementation(() => {
            throw new Error('Authentication required');
        });

        // Act & Assert
        expect(() => renderHook(() => useGetMessage({id: 'message_123' as Id<"messages">}))).toThrow('Authentication required');
    });

    it('should handle authentication errors in paginated queries', () => {
        // Arrange
        mockUsePaginatedQuery.mockImplementation(() => {
            throw new Error('Authentication required');
        });

        // Act & Assert
        expect(() => renderHook(() => useGetMessages({channelId: 'channel_456' as Id<"channels">}))).toThrow('Authentication required');
    });

    it('should handle malformed message data', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useGetMessage({id: 'malformed_message' as Id<"messages">}));

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle message validation across hooks', async () => {
        // Arrange
        const validationError = new Error('Message body is required');
        mockMutationFn.mockRejectedValue(validationError);

        // Test create message validation
        const {result: createResult} = renderHook(() => useCreateMessage());

        await act(async () => {
            await expect(
                createResult.current.mutate({
                    body: '',
                    workspaceId: 'workspace_123' as Id<"workspaces">,
                    channelId: 'channel_456' as Id<"channels">
                }, { throwError: true })
            ).rejects.toThrow(validationError.message);
        });

        // Test update message validation
        const {result: updateResult} = renderHook(() => useUpdateMessage());

        await act(async () => {
            await expect(
                updateResult.current.mutate({
                    id: 'message_123' as Id<"messages">,
                    body: ''
                }, { throwError: true })
            ).rejects.toThrow(validationError.message);
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledTimes(2);
    });

    it('should handle message permissions across hooks', async () => {
        // Arrange
        const permissionError = new Error('Only message author can update');
        mockMutationFn.mockRejectedValue(permissionError);

        // Test update permission
        const {result: updateResult} = renderHook(() => useUpdateMessage());

        await act(async () => {
            await expect(
                updateResult.current.mutate({
                    id: 'message_123' as Id<"messages">,
                    body: 'Unauthorized update'
                }, { throwError: true })
            ).rejects.toThrow(permissionError.message);
        });

        // Test delete permission
        const {result: deleteResult} = renderHook(() => useRemoveMessage());

        const deleteError = new Error('Only message author can delete');
        mockMutationFn.mockRejectedValue(deleteError);

        await act(async () => {
            await expect(
                deleteResult.current.mutate({
                    id: 'message_123' as Id<"messages">
                }, { throwError: true })
            ).rejects.toThrow(deleteError.message);
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledTimes(2);
    });

    it('should handle pending states during mutations', async () => {
        // Arrange
        let resolveMutation: (value: Id<"messages">) => void;
        const mutationPromise = new Promise<Id<"messages">>((resolve) => {
            resolveMutation = resolve;
        });
        mockMutationFn.mockReturnValue(mutationPromise);

        // Act
        const {result} = renderHook(() => useCreateMessage());

        // Start mutation but don't await it yet
        act(() => {
            result.current.mutate({
                body: 'Test message',
                workspaceId: 'workspace_123' as Id<"workspaces">,
                channelId: 'channel_456' as Id<"channels">
            });
        });

        // Check if pending state is set
        const pendingState = result.current.isPending;

        // Now resolve the mutation
        await act(async () => {
            resolveMutation!('message_123' as Id<"messages">);
            await mutationPromise;
        });

        // Assert
        expect(pendingState).toBe(true);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSettled).toBe(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
});