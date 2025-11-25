import {renderHook, act} from '@testing-library/react';
import {api} from '../../convex/_generated/api';
import {useMutation} from 'convex/react';
import {Id} from '../../convex/_generated/dataModel';

import {useCreateOrGetConversation} from '@/features/conversations/api/use-create-or-get-conversation';

// Mock convex/react
jest.mock('convex/react', () => ({
    useMutation: jest.fn(),
}));


describe('useCreateOrGetConversation', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();

    const mockConversationId = 'conversation_123' as Id<"conversations">;
    const mockWorkspaceId = 'workspace_123' as Id<"workspaces">;
    const mockMemberId = 'member_456' as Id<"members">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.conversations.createOrGet);
    });

    it('should create new conversation between two members', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockConversationId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        await act(async () => {
            await result.current.mutate({
                workspaceId: mockWorkspaceId,
                memberId: mockMemberId
            }, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            workspaceId: mockWorkspaceId,
            memberId: mockMemberId
        });
        expect(onSuccess).toHaveBeenCalledWith(mockConversationId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should return existing conversation if already exists', async () => {
        // Arrange
        const existingConversationId = 'conversation_existing' as Id<"conversations">;
        mockMutationFn.mockResolvedValue(existingConversationId);

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        await act(async () => {
            await result.current.mutate({
                workspaceId: mockWorkspaceId,
                memberId: mockMemberId
            });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            workspaceId: mockWorkspaceId,
            memberId: mockMemberId
        });
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail when member not found', async () => {
        // Arrange
        const mockError = new Error('Member not found');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        await act(async () => {
            await result.current.mutate({
                workspaceId: mockWorkspaceId,
                memberId: 'non_existent_member' as Id<"members">
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail when user is not authenticated', async () => {
        // Arrange
        const mockError = new Error('Unauthorized');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    workspaceId: mockWorkspaceId,
                    memberId: mockMemberId
                }, { throwError: true })
            ).rejects.toThrow('Unauthorized');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should fail when user is not member of workspace', async () => {
        // Arrange
        const mockError = new Error('Member not found');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        await act(async () => {
            await result.current.mutate({
                workspaceId: 'restricted_workspace' as Id<"workspaces">,
                memberId: mockMemberId
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle conversation creation between workspace members', async () => {
        // Arrange
        const newConversationId = 'new_conversation_789' as Id<"conversations">;
        mockMutationFn.mockResolvedValue(newConversationId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        await act(async () => {
            await result.current.mutate({
                workspaceId: mockWorkspaceId,
                memberId: 'valid_member' as Id<"members">
            }, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            workspaceId: mockWorkspaceId,
            memberId: 'valid_member' as Id<"members">
        });
        expect(onSuccess).toHaveBeenCalledWith(newConversationId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should call onSettled callback after mutation completes', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockConversationId);
        const onSettled = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        await act(async () => {
            await result.current.mutate({
                workspaceId: mockWorkspaceId,
                memberId: mockMemberId
            }, { onSettled });
        });

        // Assert
        expect(onSettled).toHaveBeenCalled();
        expect(result.current.isSettled).toBe(true);
    });

    it('should set pending state during mutation', async () => {
        // Arrange
        let resolveMutation: (value: Id<"conversations">) => void;
        const mutationPromise = new Promise<Id<"conversations">>((resolve) => {
            resolveMutation = resolve;
        });
        mockMutationFn.mockReturnValue(mutationPromise);

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        // Start mutation but don't await it yet
        act(() => {
            result.current.mutate({
                workspaceId: mockWorkspaceId,
                memberId: mockMemberId
            });
        });

        // Check if pending state is set
        const pendingState = result.current.isPending;

        // Now resolve the mutation
        await act(async () => {
            resolveMutation!(mockConversationId);
            await mutationPromise;
        });

        // Assert
        expect(pendingState).toBe(true);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSettled).toBe(true);
    });

    it('should reset data and error state on new mutation', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockConversationId);

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        await act(async () => {
            await result.current.mutate({
                workspaceId: mockWorkspaceId,
                memberId: mockMemberId
            });
        });

        // Simulate a second mutation with different member
        await act(async () => {
            await result.current.mutate({
                workspaceId: mockWorkspaceId,
                memberId: 'different_member' as Id<"members">
            });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledTimes(2);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle conversation deduplication correctly', async () => {
        // Arrange - simulate returning existing conversation
        const existingConversationId = 'existing_conversation_456' as Id<"conversations">;
        mockMutationFn.mockResolvedValue(existingConversationId);

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        await act(async () => {
            await result.current.mutate({
                workspaceId: mockWorkspaceId,
                memberId: mockMemberId
            });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            workspaceId: mockWorkspaceId,
            memberId: mockMemberId
        });
        expect(result.current.isSettled).toBe(true);
    });
});

describe('Conversation Integration Tests', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should create or get conversation and return conversation ID', async () => {
        // Arrange
        const conversationData = {
            workspaceId: 'workspace_123' as Id<"workspaces">,
            memberId: 'member_456' as Id<"members">
        };
        const expectedConversationId = 'conversation_789' as Id<"conversations">;
        mockMutationFn.mockResolvedValue(expectedConversationId);

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        await act(async () => {
            await result.current.mutate(conversationData);
        });

        // Assert
        expect(mockUseMutation).toHaveBeenCalledWith(api.conversations.createOrGet);
        expect(mockMutationFn).toHaveBeenCalledWith(conversationData);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
        // Arrange
        const networkError = new Error('Network error');
        mockMutationFn.mockRejectedValue(networkError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        await act(async () => {
            await result.current.mutate({
                workspaceId: 'workspace_123' as Id<"workspaces">,
                memberId: 'member_456' as Id<"members">
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(networkError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle authentication errors', async () => {
        // Arrange
        const authError = new Error('Unauthorized');
        mockMutationFn.mockRejectedValue(authError);

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    workspaceId: 'workspace_123' as Id<"workspaces">,
                    memberId: 'member_456' as Id<"members">
                }, { throwError: true })
            ).rejects.toThrow('Unauthorized');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should handle member validation errors', async () => {
        // Arrange
        const memberError = new Error('Member not found');
        mockMutationFn.mockRejectedValue(memberError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        await act(async () => {
            await result.current.mutate({
                workspaceId: 'workspace_123' as Id<"workspaces">,
                memberId: 'invalid_member' as Id<"members">
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(memberError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle workspace access validation', async () => {
        // Arrange
        const accessError = new Error('Member not found');
        mockMutationFn.mockRejectedValue(accessError);

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    workspaceId: 'restricted_workspace' as Id<"workspaces">,
                    memberId: 'member_456' as Id<"members">
                }, { throwError: true })
            ).rejects.toThrow('Member not found');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should handle conversation deduplication in backend', async () => {
        // Arrange
        const existingId = 'existing_conv_123' as Id<"conversations">;
        mockMutationFn.mockResolvedValue(existingId);

        // Act
        const {result} = renderHook(() => useCreateOrGetConversation());

        // Simulate multiple calls with same members (should return same conversation)
        await act(async () => {
            await result.current.mutate({
                workspaceId: 'workspace_123' as Id<"workspaces">,
                memberId: 'member_456' as Id<"members">
            });
        });

        await act(async () => {
            await result.current.mutate({
                workspaceId: 'workspace_123' as Id<"workspaces">,
                memberId: 'member_456' as Id<"members">
            });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledTimes(2);
        expect(result.current.isSettled).toBe(true);
    });
});