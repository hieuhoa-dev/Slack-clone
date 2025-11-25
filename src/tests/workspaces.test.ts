import {renderHook, act} from '@testing-library/react';
import {api} from '../../convex/_generated/api';
import {useQuery, useMutation} from 'convex/react';
import {Id} from '../../convex/_generated/dataModel';

import {useCreateWorkspace} from '@/features/workspaces/api/use-create-workspace';
import {useJoin} from '@/features/workspaces/api/use-join';
import {useUpdateWorkspace} from '@/features/workspaces/api/use-update-workspace';
import {useRemoveWorkspace} from '@/features/workspaces/api/use-remove-workspace';
import {useGetWorkspaces} from '@/features/workspaces/api/use-get-workspaces';
import {useGetWorkspace} from '@/features/workspaces/api/use-get-workspace';
import {useNewJoinCode} from '@/features/workspaces/api/use-new-join-code';

// Mock convex/react
jest.mock('convex/react', () => ({
    useQuery: jest.fn(),
    useMutation: jest.fn(),
}));

describe('useCreateWorkspace', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();

    const mockWorkspaceId = 'workspace_123' as Id<"workspaces">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useCreateWorkspace());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.workspaces.create);
    });

    it('should create workspace successfully with valid name', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockWorkspaceId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateWorkspace());

        await act(async () => {
            await result.current.mutate({name: 'Test Workspace'}, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({name: 'Test Workspace'});
        expect(onSuccess).toHaveBeenCalledWith(mockWorkspaceId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to create workspace with empty name', async () => {
        // Arrange
        const mockError = new Error('Name is required');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateWorkspace());

        await act(async () => {
            await result.current.mutate({name: ''}, { onError });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({name: ''});
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to create workspace with name longer than 80 characters', async () => {
        // Arrange
        const longName = 'A'.repeat(81);
        const mockError = new Error('Name must be 80 characters or less');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useCreateWorkspace());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({name: longName}, { throwError: true })
            ).rejects.toThrow('Name must be 80 characters or less');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should generate unique workspace IDs for each creation', async () => {
        // Arrange
        const workspace1Id = 'workspace_1' as Id<"workspaces">;
        const workspace2Id = 'workspace_2' as Id<"workspaces">;

        mockMutationFn
            .mockResolvedValueOnce(workspace1Id)
            .mockResolvedValueOnce(workspace2Id);

        // Act
        const {result} = renderHook(() => useCreateWorkspace());

        await act(async () => {
            await result.current.mutate({name: 'Workspace 1'});
        });

        await act(async () => {
            await result.current.mutate({name: 'Workspace 2'});
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledTimes(2);
        expect(result.current.isSettled).toBe(true);
    });
});

describe('useJoin', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();

    const mockWorkspaceId = 'workspace_123' as Id<"workspaces">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useJoin());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.workspaces.join);
    });

    it('should join workspace successfully with valid join code', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockWorkspaceId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useJoin());

        await act(async () => {
            await result.current.mutate({
                workspaceId: mockWorkspaceId,
                joinCode: 'ABC123'
            }, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            workspaceId: mockWorkspaceId,
            joinCode: 'ABC123'
        });
        expect(onSuccess).toHaveBeenCalledWith(mockWorkspaceId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to join with invalid join code', async () => {
        // Arrange
        const mockError = new Error('Invalid join code');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useJoin());

        await act(async () => {
            await result.current.mutate({
                workspaceId: mockWorkspaceId,
                joinCode: 'INVALID'
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to join with expired join code', async () => {
        // Arrange
        const mockError = new Error('Join code has expired');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useJoin());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    workspaceId: mockWorkspaceId,
                    joinCode: 'EXPIRED'
                }, { throwError: true })
            ).rejects.toThrow('Join code has expired');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should not allow duplicate membership', async () => {
        // Arrange
        const mockError = new Error('Already a member of this workspace');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useJoin());

        await act(async () => {
            await result.current.mutate({
                workspaceId: mockWorkspaceId,
                joinCode: 'ABC123'
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });
});

describe('useUpdateWorkspace', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();

    const mockWorkspaceId = 'workspace_123' as Id<"workspaces">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useUpdateWorkspace());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.workspaces.update);
    });

    it('should update workspace name successfully by admin', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockWorkspaceId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateWorkspace());

        await act(async () => {
            await result.current.mutate({
                id: mockWorkspaceId,
                name: 'Updated Workspace Name'
            }, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            id: mockWorkspaceId,
            name: 'Updated Workspace Name'
        });
        expect(onSuccess).toHaveBeenCalledWith(mockWorkspaceId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to update workspace by non-admin', async () => {
        // Arrange
        const mockError = new Error('Only admins can update workspace');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateWorkspace());

        await act(async () => {
            await result.current.mutate({
                id: mockWorkspaceId,
                name: 'New Name'
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to update with invalid workspace ID', async () => {
        // Arrange
        const mockError = new Error('Workspace not found');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useUpdateWorkspace());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: 'invalid_id' as Id<"workspaces">,
                    name: 'New Name'
                }, { throwError: true })
            ).rejects.toThrow('Workspace not found');
        });

        expect(result.current.isSettled).toBe(true);
    });
});

describe('useRemoveWorkspace', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();

    const mockWorkspaceId = 'workspace_123' as Id<"workspaces">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useRemoveWorkspace());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.workspaces.remove);
    });

    it('should delete workspace successfully by admin', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockWorkspaceId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useRemoveWorkspace());

        await act(async () => {
            await result.current.mutate({id: mockWorkspaceId}, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({id: mockWorkspaceId});
        expect(onSuccess).toHaveBeenCalledWith(mockWorkspaceId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to delete workspace by non-admin', async () => {
        // Arrange
        const mockError = new Error('Only admins can delete workspace');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useRemoveWorkspace());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({id: mockWorkspaceId}, { throwError: true })
            ).rejects.toThrow('Only admins can delete workspace');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should handle cascade delete of related data', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockWorkspaceId);
        const onSettled = jest.fn();

        // Act
        const {result} = renderHook(() => useRemoveWorkspace());

        await act(async () => {
            await result.current.mutate({id: mockWorkspaceId}, { onSettled });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({id: mockWorkspaceId});
        expect(onSettled).toHaveBeenCalled();
        expect(result.current.isSettled).toBe(true);
    });
});

describe('useGetWorkspaces', () => {
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return workspaces data when loaded', () => {
        // Arrange
        const mockWorkspaces = [
            {
                _id: 'workspace_1' as Id<"workspaces">,
                name: 'Workspace 1',
                joinCode: 'ABC123',
                _creationTime: Date.now()
            },
            {
                _id: 'workspace_2' as Id<"workspaces">,
                name: 'Workspace 2',
                joinCode: 'DEF456',
                _creationTime: Date.now()
            }
        ];

        mockUseQuery.mockReturnValue(mockWorkspaces);

        // Act
        const {result} = renderHook(() => useGetWorkspaces());

        // Assert
        expect(result.current.data).toEqual(mockWorkspaces);
        expect(result.current.isLoading).toBe(false);
        expect(mockUseQuery).toHaveBeenCalledWith(api.workspaces.get);
    });

    it('should show loading state when data is undefined', () => {
        // Arrange
        mockUseQuery.mockReturnValue(undefined);

        // Act
        const {result} = renderHook(() => useGetWorkspaces());

        // Assert
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
        expect(mockUseQuery).toHaveBeenCalledWith(api.workspaces.get);
    });

    it('should return empty array when user has no workspaces', () => {
        // Arrange
        mockUseQuery.mockReturnValue([]);

        // Act
        const {result} = renderHook(() => useGetWorkspaces());

        // Assert
        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });
});

describe('useGetWorkspace', () => {
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
    const mockWorkspaceId = 'workspace_123' as Id<"workspaces">;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return workspace details by ID', () => {
        // Arrange
        const mockWorkspace = {
            _id: mockWorkspaceId,
            name: 'Test Workspace',
            joinCode: 'ABC123',
            userId: 'user_123' as Id<"users">,
            _creationTime: Date.now()
        };

        mockUseQuery.mockReturnValue(mockWorkspace);

        // Act
        const {result} = renderHook(() => useGetWorkspace({id: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toEqual(mockWorkspace);
        expect(result.current.isLoading).toBe(false);
        expect(mockUseQuery).toHaveBeenCalledWith(api.workspaces.getById, {id: mockWorkspaceId});
    });

    it('should return null for non-existent workspace', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useGetWorkspace({id: 'non_existent' as Id<"workspaces">}));

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should show loading state when data is undefined', () => {
        // Arrange
        mockUseQuery.mockReturnValue(undefined);

        // Act
        const {result} = renderHook(() => useGetWorkspace({id: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });
});

describe('useNewJoinCode', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();
    const mockWorkspaceId = 'workspace_123' as Id<"workspaces">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useNewJoinCode());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.workspaces.newJoinCode);
    });

    it('should generate new join code successfully by admin', async () => {
        // Arrange
        const newJoinCode = 'XYZ789';
        mockMutationFn.mockResolvedValue(newJoinCode);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useNewJoinCode());

        await act(async () => {
            await result.current.mutate({workspaceId: mockWorkspaceId}, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({workspaceId: mockWorkspaceId});
        expect(onSuccess).toHaveBeenCalledWith(newJoinCode);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to generate join code by non-admin', async () => {
        // Arrange
        const mockError = new Error('Only admins can generate join code');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useNewJoinCode());

        await act(async () => {
            await result.current.mutate({workspaceId: mockWorkspaceId}, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should generate unique join codes', async () => {
        // Arrange
        const workspace1Id = 'workspace_1' as Id<"workspaces">;
        const workspace2Id = 'workspace_2' as Id<"workspaces">;

        mockMutationFn
            .mockResolvedValueOnce('CODE1')
            .mockResolvedValueOnce('CODE2');

        // Act
        const {result} = renderHook(() => useNewJoinCode());

        await act(async () => {
            await result.current.mutate({workspaceId: workspace1Id});
        });

        await act(async () => {
            await result.current.mutate({workspaceId: workspace2Id});
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledTimes(2);
        expect(result.current.isSettled).toBe(true);
    });
});

describe('Workspace Integration Tests', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
    const mockMutationFn = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should handle workspace name validation', async () => {
        // Arrange
        const mockError = new Error('Invalid workspace name format');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useCreateWorkspace());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({name: '###Invalid###'}, { throwError: true })
            ).rejects.toThrow('Invalid workspace name format');
        });
    });

    it('should handle network errors gracefully', async () => {
        // Arrange
        const networkError = new Error('Network error');
        mockMutationFn.mockRejectedValue(networkError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useCreateWorkspace());

        await act(async () => {
            await result.current.mutate({name: 'Test'}, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(networkError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should handle authentication errors in queries', () => {
        // Arrange
        mockUseQuery.mockImplementation(() => {
            throw new Error('Authentication required');
        });

        // Act & Assert
        expect(() => renderHook(() => useGetWorkspaces())).toThrow('Authentication required');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
});