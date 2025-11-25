import {renderHook, act} from '@testing-library/react';
import {api} from '../../convex/_generated/api';
import {useQuery, useMutation} from 'convex/react';
import {Id} from '../../convex/_generated/dataModel';

import {useGetMembers} from '@/features/members/api/use-get-members';
import {useGetMember} from '@/features/members/api/use-get-member';
import {useCurrentMember} from '@/features/members/api/use-current-member';
import {useUpdateMember} from '@/features/members/api/use-update-member';
import {useRemoveMember} from '@/features/members/api/use-remove-member';

// Mock convex/react
jest.mock('convex/react', () => ({
    useQuery: jest.fn(),
    useMutation: jest.fn(),
}));


describe('useGetMembers', () => {
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
    const mockWorkspaceId = 'workspace_123' as Id<"workspaces">;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return members in workspace successfully', () => {
        // Arrange
        const mockMembers = [
            {
                _id: 'member_1' as Id<"members">,
                userId: 'user_1' as Id<"users">,
                workspaceId: mockWorkspaceId,
                role: 'admin' as const,
                _creationTime: Date.now()
            },
            {
                _id: 'member_2' as Id<"members">,
                userId: 'user_2' as Id<"users">,
                workspaceId: mockWorkspaceId,
                role: 'member' as const,
                _creationTime: Date.now()
            }
        ];

        mockUseQuery.mockReturnValue(mockMembers);

        // Act
        const {result} = renderHook(() => useGetMembers({workspaceId: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toEqual(mockMembers);
        expect(result.current.isLoading).toBe(false);
        expect(mockUseQuery).toHaveBeenCalledWith(api.members.get, {workspaceId: mockWorkspaceId});
    });

    it('should return empty array for workspace with no members', () => {
        // Arrange
        mockUseQuery.mockReturnValue([]);

        // Act
        const {result} = renderHook(() => useGetMembers({workspaceId: 'empty_workspace' as Id<"workspaces">}));

        // Assert
        expect(result.current.data).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('should show loading state when data is undefined', () => {
        // Arrange
        mockUseQuery.mockReturnValue(undefined);

        // Act
        const {result} = renderHook(() => useGetMembers({workspaceId: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });

    it('should only return members user has access to', () => {
        // Arrange
        const accessibleMembers = [
            {
                _id: 'member_1' as Id<"members">,
                userId: 'user_1' as Id<"users">,
                workspaceId: mockWorkspaceId,
                role: 'admin' as const,
                _creationTime: Date.now()
            }
        ];

        mockUseQuery.mockReturnValue(accessibleMembers);

        // Act
        const {result} = renderHook(() => useGetMembers({workspaceId: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toEqual(accessibleMembers);
        expect(result.current.isLoading).toBe(false);
    });
});

describe('useGetMember', () => {
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
    const mockMemberId = 'member_123' as Id<"members">;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return member details by ID', () => {
        // Arrange
        const mockMember = {
            _id: mockMemberId,
            userId: 'user_123' as Id<"users">,
            workspaceId: 'workspace_123' as Id<"workspaces">,
            role: 'admin' as const,
            _creationTime: Date.now()
        };

        mockUseQuery.mockReturnValue(mockMember);

        // Act
        const {result} = renderHook(() => useGetMember({id: mockMemberId}));

        // Assert
        expect(result.current.data).toEqual(mockMember);
        expect(result.current.isLoading).toBe(false);
        expect(mockUseQuery).toHaveBeenCalledWith(api.members.getById, {id: mockMemberId});
    });

    it('should return null for non-existent member', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useGetMember({id: 'non_existent' as Id<"members">}));

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should show loading state when data is undefined', () => {
        // Arrange
        mockUseQuery.mockReturnValue(undefined);

        // Act
        const {result} = renderHook(() => useGetMember({id: mockMemberId}));

        // Assert
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });

    it('should return null when user has no access to member', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useGetMember({id: 'restricted_member' as Id<"members">}));

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });
});

describe('useCurrentMember', () => {
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
    const mockWorkspaceId = 'workspace_123' as Id<"workspaces">;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return current user membership in workspace', () => {
        // Arrange
        const currentMember = {
            _id: 'member_current' as Id<"members">,
            userId: 'current_user' as Id<"users">,
            workspaceId: mockWorkspaceId,
            role: 'member' as const,
            _creationTime: Date.now()
        };

        mockUseQuery.mockReturnValue(currentMember);

        // Act
        const {result} = renderHook(() => useCurrentMember({workspaceId: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toEqual(currentMember);
        expect(result.current.isLoading).toBe(false);
        expect(mockUseQuery).toHaveBeenCalledWith(api.members.current, {workspaceId: mockWorkspaceId});
    });

    it('should return null when user is not a member', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useCurrentMember({workspaceId: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should show loading state when data is undefined', () => {
        // Arrange
        mockUseQuery.mockReturnValue(undefined);

        // Act
        const {result} = renderHook(() => useCurrentMember({workspaceId: mockWorkspaceId}));

        // Assert
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });
});

describe('useUpdateMember', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();
    const mockMemberId = 'member_123' as Id<"members">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useUpdateMember());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.members.update);
    });

    it('should update member role successfully by admin', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockMemberId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateMember());

        await act(async () => {
            await result.current.mutate({
                id: mockMemberId,
                role: 'admin'
            }, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({
            id: mockMemberId,
            role: 'admin'
        });
        expect(onSuccess).toHaveBeenCalledWith(mockMemberId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to update role by non-admin', async () => {
        // Arrange
        const mockError = new Error('Only admins can update member roles');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateMember());

        await act(async () => {
            await result.current.mutate({
                id: mockMemberId,
                role: 'admin'
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to update own role as last admin', async () => {
        // Arrange
        const mockError = new Error('Cannot remove last admin from workspace');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useUpdateMember());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: 'last_admin' as Id<"members">,
                    role: 'member'
                }, { throwError: true })
            ).rejects.toThrow('Cannot remove last admin from workspace');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to update role of non-existent member', async () => {
        // Arrange
        const mockError = new Error('Member not found');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useUpdateMember());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: 'non_existent' as Id<"members">,
                    role: 'admin'
                }, { throwError: true })
            ).rejects.toThrow('Member not found');
        });
    });

    it('should validate role values', async () => {
        // Arrange - test both valid roles
        mockMutationFn.mockResolvedValue(mockMemberId);

        // Act
        const {result} = renderHook(() => useUpdateMember());

        // Test admin role
        await act(async () => {
            await result.current.mutate({
                id: mockMemberId,
                role: 'admin'
            });
        });

        // Test member role
        await act(async () => {
            await result.current.mutate({
                id: mockMemberId,
                role: 'member'
            });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledTimes(2);
        expect(result.current.isSettled).toBe(true);
    });

    it('should call onSettled callback after mutation completes', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockMemberId);
        const onSettled = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateMember());

        await act(async () => {
            await result.current.mutate({
                id: mockMemberId,
                role: 'admin'
            }, { onSettled });
        });

        // Assert
        expect(onSettled).toHaveBeenCalled();
        expect(result.current.isSettled).toBe(true);
    });
});

describe('useRemoveMember', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();
    const mockMemberId = 'member_123' as Id<"members">;

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    it('should initialize with correct default state', () => {
        // Act
        const {result} = renderHook(() => useRemoveMember());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isSettled).toBe(false);
        expect(typeof result.current.mutate).toBe('function');
        expect(mockUseMutation).toHaveBeenCalledWith(api.members.remove);
    });

    it('should remove member successfully by admin', async () => {
        // Arrange
        mockMutationFn.mockResolvedValue(mockMemberId);
        const onSuccess = jest.fn();

        // Act
        const {result} = renderHook(() => useRemoveMember());

        await act(async () => {
            await result.current.mutate({ id: mockMemberId }, { onSuccess });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({ id: mockMemberId });
        expect(onSuccess).toHaveBeenCalledWith(mockMemberId);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to remove member by non-admin', async () => {
        // Arrange
        const mockError = new Error('Only admins can remove members');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useRemoveMember());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({ id: mockMemberId }, { throwError: true })
            ).rejects.toThrow('Only admins can remove members');
        });

        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to remove last admin', async () => {
        // Arrange
        const mockError = new Error('Cannot remove last admin from workspace');
        mockMutationFn.mockRejectedValue(mockError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useRemoveMember());

        await act(async () => {
            await result.current.mutate({ id: 'last_admin' as Id<"members"> }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.isSettled).toBe(true);
    });

    it('should fail to remove non-existent member', async () => {
        // Arrange
        const mockError = new Error('Member not found');
        mockMutationFn.mockRejectedValue(mockError);

        // Act
        const {result} = renderHook(() => useRemoveMember());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({ id: 'non_existent' as Id<"members"> }, { throwError: true })
            ).rejects.toThrow('Member not found');
        });
    });

    it('should allow member to remove themselves', async () => {
        // Arrange
        const selfMemberId = 'self_member' as Id<"members">;
        mockMutationFn.mockResolvedValue(selfMemberId);

        // Act
        const {result} = renderHook(() => useRemoveMember());

        await act(async () => {
            await result.current.mutate({ id: selfMemberId });
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledWith({ id: selfMemberId });
        expect(result.current.isSettled).toBe(true);
    });

    it('should set pending state during mutation', async () => {
        // Arrange
        let resolveMutation: (value: Id<"members">) => void;
        const mutationPromise = new Promise<Id<"members">>((resolve) => {
            resolveMutation = resolve;
        });
        mockMutationFn.mockReturnValue(mutationPromise);

        // Act
        const {result} = renderHook(() => useRemoveMember());

        // Start mutation but don't await it yet
        act(() => {
            result.current.mutate({ id: mockMemberId });
        });

        // Check if pending state is set
        const pendingState = result.current.isPending;

        // Now resolve the mutation
        await act(async () => {
            resolveMutation!(mockMemberId);
            await mutationPromise;
        });

        // Assert
        expect(pendingState).toBe(true);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSettled).toBe(true);
    });
});

describe('Member Management Integration Tests', () => {
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
        const {result} = renderHook(() => useUpdateMember());

        await act(async () => {
            await result.current.mutate({
                id: 'member_123' as Id<"members">,
                role: 'admin'
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
        const {result} = renderHook(() => useRemoveMember());

        // Assert
        await act(async () => {
            await expect(
                result.current.mutate({
                    id: 'member_123' as Id<"members">
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
        expect(() => renderHook(() => useGetMembers({workspaceId: 'workspace_123' as Id<"workspaces">}))).toThrow('Authentication required');
    });

    it('should handle invalid workspace ID', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useCurrentMember({workspaceId: 'invalid_workspace' as Id<"workspaces">}));

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should maintain at least one admin validation', async () => {
        // Arrange
        const adminError = new Error('Workspace must have at least one admin');
        mockMutationFn.mockRejectedValue(adminError);

        // Act - Test update member
        const {result: updateResult} = renderHook(() => useUpdateMember());

        await act(async () => {
            await expect(
                updateResult.current.mutate({
                    id: 'only_admin' as Id<"members">,
                    role: 'member'
                }, { throwError: true })
            ).rejects.toThrow('Workspace must have at least one admin');
        });

        // Act - Test remove member
        const {result: removeResult} = renderHook(() => useRemoveMember());

        await act(async () => {
            await expect(
                removeResult.current.mutate({
                    id: 'only_admin' as Id<"members">
                }, { throwError: true })
            ).rejects.toThrow('Workspace must have at least one admin');
        });

        // Assert
        expect(mockMutationFn).toHaveBeenCalledTimes(2);
    });

    it('should validate workspace membership for operations', async () => {
        // Arrange
        const membershipError = new Error('Not a member of this workspace');
        mockMutationFn.mockRejectedValue(membershipError);
        const onError = jest.fn();

        // Act
        const {result} = renderHook(() => useUpdateMember());

        await act(async () => {
            await result.current.mutate({
                id: 'member_123' as Id<"members">,
                role: 'admin'
            }, { onError });
        });

        // Assert
        expect(onError).toHaveBeenCalledWith(membershipError);
        expect(result.current.isSettled).toBe(true);
    });
});