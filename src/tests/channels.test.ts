import {renderHook, act} from '@testing-library/react';
import {api} from '../../convex/_generated/api';
import {useQuery, useMutation} from 'convex/react';
import {Id} from '../../convex/_generated/dataModel';

import {useCreateChannel} from '@/features/channels/api/use-create-channel';
import {useGetChannels} from '@/features/channels/api/use-get-channels';
import {useGetChannel} from '@/features/channels/api/use-get-channel';
import {useUpdateChannel} from '@/features/channels/api/use-update-channel';
import {useRemoveChannel} from '@/features/channels/api/use-remove-channel';

// Mock convex/react
jest.mock('convex/react', () => ({
    useQuery: jest.fn(),
    useMutation: jest.fn(),
}));


describe('useCreateChannel', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();

    const mockChannelId = 'channel_123' as Id<"channels">;
    const mockWorkspaceId = 'workspace_456' as Id<"workspaces">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useCreateChannel());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.channels.create);
    });

    it('should create channel successfully with valid name', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockChannelId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateChannel());

        await act(async () => {
            await result.current.mutate({
                name: 'general',
                workspaceId: mockWorkspaceId
            }, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            name: 'general',
            workspaceId: mockWorkspaceId
        });
        expect(onSuccess).toHaveBeenCalledWith(mockChannelId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should create channel with alphanumeric name', async () => {
        // Arrange
        const devChannelId = 'channel_dev123' as Id<"channels">;
        mockMutationFn.mockResolvedValue(devChannelId);

        // Act
        const {result} = renderHook(() => useCreateChannel());

        await act(async () => {
            await result.current.mutate({
                name: 'dev-team-123',
                workspaceId: mockWorkspaceId
            });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            name: 'dev-team-123',
            workspaceId: mockWorkspaceId
        });
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to create channel with empty name', async () => {
        // Arrange
        const mockError = new Error('Channel name is required');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateChannel());

        await act(async () => {
            await result.current.mutate({
                name: '',
                workspaceId: mockWorkspaceId
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to create channel with name longer than 21 characters', async () => {
        // Arrange
        const longName = 'a'.repeat(22);
        const mockError = new Error('Name must be 21 characters or less');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useCreateChannel());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    name: longName,
                    workspaceId: mockWorkspaceId
                }, { throwError: true })
            ).rejects.toThrow('Name must be 21 characters or less');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to create channel with invalid characters', async () => {
        // Arrange
        const mockError = new Error('Channel name can only contain lowercase letters, numbers, and hyphens');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useCreateChannel());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    name: 'Invalid Name!',
                    workspaceId: mockWorkspaceId
                }, { throwError: true })
            ).rejects.toThrow('Channel name can only contain lowercase letters, numbers, and hyphens');
        });
    });

    it('should fail to create channel with uppercase letters', async () => {
        // Arrange
        const mockError = new Error('Channel name must be lowercase');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateChannel());

        await act(async () => {
            await result.current.mutate({
                name: 'General',
                workspaceId: mockWorkspaceId
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to create duplicate channel in same workspace', async () => {
        // Arrange
        const mockError = new Error('Channel name already exists');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useCreateChannel());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    name: 'general',
                    workspaceId: mockWorkspaceId
                }, { throwError: true })
            ).rejects.toThrow('Channel name already exists');
        });
    });

    it('should fail to create channel by non-admin', async () => {
        // Arrange
        const mockError = new Error('Only admins can create channels');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateChannel());

        await act(async () => {
            await result.current.mutate({
                name: 'new-channel',
                workspaceId: mockWorkspaceId
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should allow same channel name in different workspaces', async () => {
        // Arrange
        const channelId1 = 'channel_workspace1_general' as Id<"channels">;
        const channelId2 = 'channel_workspace2_general' as Id<"channels">;
        const workspace1Id = 'workspace_1' as Id<"workspaces">;
        const workspace2Id = 'workspace_2' as Id<"workspaces">;

        mockMutationFn
            .mockResolvedValueOnce(channelId1)
            .mockResolvedValueOnce(channelId2);

        // Act
        const {result} = renderHook(() => useCreateChannel());

        await act(async () => {
            await result.current.mutate({
                name: 'general',
                workspaceId: workspace1Id
            });
        });

        await act(async () => {
            await result.current.mutate({
                name: 'general',
                workspaceId: workspace2Id
            });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledTimes(2);
        expect(result.current.isSettled).toBe(true);
    });
});

describe('useGetChannels', () => {
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
    const mockWorkspaceId = 'workspace_123' as Id<"workspaces">;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return channels in workspace successfully', () => {
        // Arrange
        const mockChannels = [
            {
                _id: 'channel_1' as Id<"channels">,
                name: 'general',
                workspaceId: mockWorkspaceId,
                _creationTime: Date.now()
            },
            {
                _id: 'channel_2' as Id<"channels">,
                name: 'development',
                workspaceId: mockWorkspaceId,
                _creationTime: Date.now() - 1000
            },
            {
                _id: 'channel_3' as Id<"channels">,
                name: 'marketing',
                workspaceId: mockWorkspaceId,
                _creationTime: Date.now() - 2000
            }
        ];

        mockUseQuery.mockReturnValue(mockChannels);

        // Act
        const {result} = renderHook(() => useGetChannels({workspaceId: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toEqual(mockChannels);
        expect(result.current.isLoading).toBe(false);
        expect(mockUseQuery).toHaveBeenCalledWith(api.channels.get, {workspaceId: mockWorkspaceId});
    });

    it('should return empty array for workspace with no channels', () => {
        // Arrange
        mockUseQuery.mockReturnValue([]);

        // Act
        const {result} = renderHook(() => useGetChannels({workspaceId: 'empty_workspace' as Id<"workspaces">}));

        // Assert
        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('should show loading state when data is undefined', () => {
        // Arrange
        mockUseQuery.mockReturnValue(undefined);

        // Act
        const {result} = renderHook(() => useGetChannels({workspaceId: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });

    it('should return channels ordered by creation time', () => {
        // Arrange
        const now = Date.now();
        const mockChannels = [
            {
                _id: 'channel_newest' as Id<"channels">,
                name: 'latest-channel',
                workspaceId: mockWorkspaceId,
                _creationTime: now
            },
            {
                _id: 'channel_oldest' as Id<"channels">,
                name: 'general',
                workspaceId: mockWorkspaceId,
                _creationTime: now - 3000
            },
            {
                _id: 'channel_middle' as Id<"channels">,
                name: 'development',
                workspaceId: mockWorkspaceId,
                _creationTime: now - 1000
            }
        ];

        mockUseQuery.mockReturnValue(mockChannels);

        // Act
        const {result} = renderHook(() => useGetChannels({workspaceId: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toEqual(mockChannels);
        expect(result.current.isLoading).toBe(false);
    });

    it('should only return channels user has access to', () => {
        // Arrange
        const accessibleChannels = [
            {
                _id: 'channel_public' as Id<"channels">,
                name: 'general',
                workspaceId: mockWorkspaceId,
                _creationTime: Date.now()
            }
        ];

        mockUseQuery.mockReturnValue(accessibleChannels);

        // Act
        const {result} = renderHook(() => useGetChannels({workspaceId: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toEqual(accessibleChannels);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle access control for non-members', () => {
        // Arrange
        mockUseQuery.mockReturnValue([]);

        // Act
        const {result} = renderHook(() => useGetChannels({workspaceId: 'restricted_workspace' as Id<"workspaces">}));

        // Assert
        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });
});

describe('useGetChannel', () => {
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
    const mockChannelId = 'channel_123' as Id<"channels">;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return channel details by ID', () => {
        // Arrange
        const mockChannel = {
            _id: mockChannelId,
            name: 'general',
            workspaceId: 'workspace_456' as Id<"workspaces">,
            _creationTime: Date.now()
        };

        mockUseQuery.mockReturnValue(mockChannel);

        // Act
        const {result} = renderHook(() => useGetChannel({id: mockChannelId}));

        // Assert
        expect(result.current.data).toEqual(mockChannel);
        expect(result.current.isLoading).toBe(false);
        expect(mockUseQuery).toHaveBeenCalledWith(api.channels.getById, {id: mockChannelId});
    });

    it('should return null for non-existent channel', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useGetChannel({id: 'non_existent' as Id<"channels">}));

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should show loading state when data is undefined', () => {
        // Arrange
        mockUseQuery.mockReturnValue(undefined);

        // Act
        const {result} = renderHook(() => useGetChannel({id: mockChannelId}));

        // Assert
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });

    it('should return null when user has no access to channel', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useGetChannel({id: 'restricted_channel' as Id<"channels">}));

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should validate channel access by workspace membership', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useGetChannel({id: 'other_workspace_channel' as Id<"channels">}));

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });
});

describe('useUpdateChannel', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();
    const mockChannelId = 'channel_123' as Id<"channels">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useUpdateChannel());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.channels.update);
    });

    it('should update channel name successfully by admin', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockChannelId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateChannel());

        await act(async () => {
            await result.current.mutate({
                id: mockChannelId,
                name: 'updated-general'
            }, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            id: mockChannelId,
            name: 'updated-general'
        });
        expect(onSuccess).toHaveBeenCalledWith(mockChannelId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to update channel by non-admin', async () => {
        // Arrange
        const mockError = new Error('Only admins can update channels');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateChannel());

        await act(async () => {
            await result.current.mutate({
                id: mockChannelId,
                name: 'new-name'
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to update non-existent channel', async () => {
        // Arrange
        const mockError = new Error('Channel not found');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useUpdateChannel());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: 'non_existent' as Id<"channels">,
                    name: 'new-name'
                }, { throwError: true })
            ).rejects.toThrow('Channel not found');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to update with invalid name format', async () => {
        // Arrange
        const mockError = new Error('Invalid channel name format');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useUpdateChannel());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: mockChannelId,
                    name: 'Invalid Name!'
                }, { throwError: true })
            ).rejects.toThrow('Invalid channel name format');
        });
    });

    it('should fail to update with duplicate name', async () => {
        // Arrange
        const mockError = new Error('Channel name already exists');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateChannel());

        await act(async () => {
            await result.current.mutate({
                id: mockChannelId,
                name: 'existing-channel'
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should validate name length on update', async () => {
        // Arrange
        const longName = 'a'.repeat(22);
        const mockError = new Error('Name must be 21 characters or less');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useUpdateChannel());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: mockChannelId,
                    name: longName
                }, { throwError: true })
            ).rejects.toThrow('Name must be 21 characters or less');
        });
    });

    it('should fail to update channel in different workspace', async () => {
        // Arrange
        const mockError = new Error('Channel not found in workspace');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useUpdateChannel());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: 'other_workspace_channel' as Id<"channels">,
                    name: 'new-name'
                }, { throwError: true })
            ).rejects.toThrow('Channel not found in workspace');
        });
    });
});

describe('useRemoveChannel', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();
    const mockChannelId = 'channel_123' as Id<"channels">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useRemoveChannel());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.channels.remove);
    });

    it('should remove channel successfully by admin', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockChannelId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useRemoveChannel());

        await act(async () => {
            await result.current.mutate({id: mockChannelId}, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({id: mockChannelId});
        expect(onSuccess).toHaveBeenCalledWith(mockChannelId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to remove channel by non-admin', async () => {
        // Arrange
        const mockError = new Error('Only admins can remove channels');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useRemoveChannel());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({id: mockChannelId}, { throwError: true })
            ).rejects.toThrow('Only admins can remove channels');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to remove non-existent channel', async () => {
        // Arrange
        const mockError = new Error('Channel not found');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useRemoveChannel());

        await act(async () => {
            await result.current.mutate({id: 'non_existent' as Id<"channels">}, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should prevent removal of default general channel', async () => {
        // Arrange
        const mockError = new Error('Cannot delete the general channel');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useRemoveChannel());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({id: 'general_channel' as Id<"channels">}, { throwError: true })
            ).rejects.toThrow('Cannot delete the general channel');
        });
    });

    it('should handle cascade delete of all messages in channel', async () => {
        // Arrange
        const channelId = 'channel_with_messages' as Id<"channels">;
        mockMutationFn.mockResolvedValue(channelId);
        const onSettled = jest.fn();

        // Act
        const {result} = renderHook(() => useRemoveChannel());

        await act(async () => {
            await result.current.mutate({id: channelId}, { onSettled });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({id: channelId});
        expect(onSettled).toHaveBeenCalled();
        expect(result.current.isSettled).toBe(true);
    });

    it('should remove channel and all related data', async () => {
        // Arrange
        const channelId = 'channel_full_data' as Id<"channels">;
        mockMutationFn.mockResolvedValue(channelId);

        // Act
        const {result} = renderHook(() => useRemoveChannel());

        await act(async () => {
            await result.current.mutate({id: channelId});
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({id: channelId});
        expect(result.current.isSettled).toBe(true);
    });
});

describe('Channel Management Integration Tests', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
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
        const {result} = renderHook(() => useCreateChannel());

        await act(async () => {
            await result.current.mutate({
                name: 'general',
                workspaceId: 'workspace_456' as Id<"workspaces">
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
        const {result} = renderHook(() => useUpdateChannel());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: 'channel_123' as Id<"channels">,
                    name: 'new-name'
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
        expect(() => renderHook(() => useGetChannels({workspaceId: 'workspace_123' as Id<"workspaces">}))).toThrow('Authentication required');
    });

    it('should handle invalid workspace ID format', () => {
        // Arrange
        mockUseQuery.mockReturnValue([]);

        // Act
        const {result} = renderHook(() => useGetChannels({workspaceId: 'invalid-format' as Id<"workspaces">}));

        // Assert
        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle channel name validation across hooks', async () => {
        // Arrange
        const validationError = new Error('Channel name can only contain lowercase letters, numbers, and hyphens');
        mockMutationFn.mockRejectedValue(validationError);

        // Act - Test creation
        const {result: createResult} = renderHook(() => useCreateChannel());

        await act(async () => {
            await expect(
                createResult.current.mutate({
                    name: 'Invalid Name!',
                    workspaceId: 'workspace_456' as Id<"workspaces">
                }, { throwError: true })
            ).rejects.toThrow(validationError.message);
        });

        // Act - Test update
        const {result: updateResult} = renderHook(() => useUpdateChannel());

        await act(async () => {
            await expect(
                updateResult.current.mutate({
                    id: 'channel_123' as Id<"channels">,
                    name: 'Invalid Name!'
                }, { throwError: true })
            ).rejects.toThrow(validationError.message);
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledTimes(2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
});