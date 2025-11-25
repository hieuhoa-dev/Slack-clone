import {renderHook, act} from '@testing-library/react';
import {api} from '../../convex/_generated/api';
import {useMutation} from 'convex/react';
import {Id} from '../../convex/_generated/dataModel';

import {useToggleReaction} from '@/features/reactions/api/use-toggle-reaction';

// Mock convex/react
jest.mock('convex/react', () => ({
    useMutation: jest.fn(),
}));


describe('useToggleReaction', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();

    const mockReactionId = 'reaction_123' as Id<"reactions">;
    const mockMessageId = 'message_123' as Id<"messages">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useToggleReaction());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.reactions.toggle);
    });

    it('should add reaction to message successfully', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockReactionId);
        const onSuccess = jest.fn();
        const reactionData = {
            messageId: mockMessageId,
            value: '👍'
        };

        // Act
        const {result} = renderHook(() => useToggleReaction());

        await act(async () => {
            await result.current.mutate(reactionData, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith(reactionData);
        expect(onSuccess).toHaveBeenCalledWith(mockReactionId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should remove existing reaction when toggling same emoji', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(null); // null indicates reaction was removed
        const reactionData = {
            messageId: mockMessageId,
            value: '👍'
        };

        // Act
        const {result} = renderHook(() => useToggleReaction());

        await act(async () => {
            await result.current.mutate(reactionData);
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith(reactionData);
        expect(result.current.isSettled).toBe(true);
    });

    it('should add different emoji reaction to same message', async () => {
        // Arrange
        const heartReactionId = 'reaction_456' as Id<"reactions">;
        mockMutationFn.mockResolvedValue(heartReactionId);
        const reactionData = {
            messageId: mockMessageId,
            value: '❤️'
        };

        // Act
        const {result} = renderHook(() => useToggleReaction());

        await act(async () => {
            await result.current.mutate(reactionData);
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith(reactionData);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle error when message not found', async () => {
        // Arrange
        const mockError = new Error('Message not found');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();
        const reactionData = {
            messageId: 'non_existent_message' as Id<"messages">,
            value: '👍'
        };

        // Act
        const {result} = renderHook(() => useToggleReaction());

        await act(async () => {
            await result.current.mutate(reactionData, { onError });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith(reactionData);
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle unauthorized reaction error', async () => {
        // Arrange
        const mockError = new Error('Not a member of this workspace');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();
        const reactionData = {
            messageId: mockMessageId,
            value: '👍'
        };

        // Act
        const {result} = renderHook(() => useToggleReaction());

        await act(async () => {
            await result.current.mutate(reactionData, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle invalid emoji value error', async () => {
        // Arrange
        const mockError = new Error('Invalid reaction value');
        mockMutationFn.mockRejectedValue(mockError);
        const reactionData = {
            messageId: mockMessageId,
            value: 'invalid_emoji'
        };

        // Act
        const {result} = renderHook(() => useToggleReaction());

        // Assert - should throw error when throwError is true
        await act(async () => {
            await expect(
                result.current.mutate(reactionData, { throwError: true })
            ).rejects.toThrow('Invalid reaction value');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should handle Unicode emoji variations', async () => {
        // Arrange
        const unicodeReactionId = 'unicode_reaction' as Id<"reactions">;
        mockMutationFn.mockResolvedValue(unicodeReactionId);
        const reactionData = {
            messageId: mockMessageId,
            value: '🎉'
        };

        // Act
        const {result} = renderHook(() => useToggleReaction());

        await act(async () => {
            await result.current.mutate(reactionData);
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith(reactionData);
        expect(result.current.isSettled).toBe(true);
    });

    it('should call onSettled callback after mutation completes', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockReactionId);
        const onSettled = jest.fn();
        const reactionData = {
            messageId: mockMessageId,
            value: '👍'
        };

        // Act
        const {result} = renderHook(() => useToggleReaction());

        await act(async () => {
            await result.current.mutate(reactionData, { onSettled });
        });

        // Assert
        expect(onSettled).toHaveBeenCalled();
        expect(result.current.isSettled).toBe(true);
    });

    it('should set pending state during mutation', async () => {
        // Arrange
        let resolveMutation: (value: Id<"reactions"> | null) => void;
        const mutationPromise = new Promise<Id<"reactions"> | null>((resolve) => {
            resolveMutation = resolve;
        });
        mockMutationFn.mockReturnValue(mutationPromise);
        const reactionData = {
            messageId: mockMessageId,
            value: '👍'
        };

        // Act
        const {result} = renderHook(() => useToggleReaction());

        // Start mutation but don't await it yet
        act(() => {
            result.current.mutate(reactionData);
        });

        // Check if pending state is set
        const pendingState = result.current.isPending;

        // Now resolve the mutation
        await act(async () => {
            resolveMutation!(mockReactionId);
            await mutationPromise;
        });

        // Assert
        expect(pendingState).toBe(true);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSettled).toBe(true);
    });

    it('should reset data and error state on new mutation', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockReactionId);
        const reactionData1 = {
            messageId: mockMessageId,
            value: '👍'
        };
        const reactionData2 = {
            messageId: mockMessageId,
            value: '❤️'
        };

        // Act
        const {result} = renderHook(() => useToggleReaction());

        await act(async () => {
            await result.current.mutate(reactionData1);
        });

        // Simulate a second mutation
        await act(async () => {
            await result.current.mutate(reactionData2);
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledTimes(2);
        expect(result.current.isSettled).toBe(true);
    });
});

describe('Reaction Toggle Integration Tests', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should toggle reaction and return reaction ID', async () => {
        // Arrange
        const reactionData = {
            messageId: 'msg_123' as Id<"messages">,
            value: '👍'
        };
        const expectedReactionId = 'reaction_123' as Id<"reactions">;
        mockMutationFn.mockResolvedValue(expectedReactionId);

        // Act
        const {result} = renderHook(() => useToggleReaction());

        await act(async () => {
            await result.current.mutate(reactionData);
        });

        // Assert
        expect(mockUseMutation).toHaveBeenCalledWith(api.reactions.toggle);
        expect(mockMutationFn).toHaveBeenCalledWith(reactionData);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle network error during reaction toggle', async () => {
        // Arrange
        const networkError = new Error('Network request failed');
        mockMutationFn.mockRejectedValue(networkError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useToggleReaction());

        await act(async () => {
            await result.current.mutate({
                messageId: 'msg_123' as Id<"messages">,
                value: '👍'
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(networkError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle validation error for invalid message ID', async () => {
        // Arrange
        const validationError = new Error('Invalid message ID format');
        mockMutationFn.mockRejectedValue(validationError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useToggleReaction());

        await act(async () => {
            await result.current.mutate({
                messageId: 'invalid_id' as Id<"messages">,
                value: '👍'
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(validationError);
        expect(result.current.isSettled).toBe(true);
    });
});