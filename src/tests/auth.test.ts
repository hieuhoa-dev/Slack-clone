import {renderHook} from '@testing-library/react';
import {useQuery} from 'convex/react';
import {useCurrentUser} from '@/features/auth/api/use-current-user';
import {api} from '../../convex/_generated/api';

// Mock convex/react
jest.mock('convex/react', () => ({
    useQuery: jest.fn(),
}));

describe('useCurrentUser', () => {
    const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call useQuery with correct API endpoint', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        renderHook(() => useCurrentUser());

        // Assert
        expect(mockUseQuery).toHaveBeenCalledTimes(1);
        expect(mockUseQuery).toHaveBeenCalledWith(api.users.current);
    });

    it('should return loading state when data is undefined', () => {
        // Arrange
        mockUseQuery.mockReturnValue(undefined);

        // Act
        const {result} = renderHook(() => useCurrentUser());

        // Assert
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
        expect(mockUseQuery).toHaveBeenCalledWith(api.users.current);
    });

    it('should return data and not loading when data is available', () => {
        // Arrange
        const mockUserData = {
            _id: 'user123',
            _creationTime: Date.now(),
            name: 'Test User',
            email: 'test@example.com',
            image: 'https://example.com/avatar.jpg',
        };
        mockUseQuery.mockReturnValue(mockUserData);

        // Act
        const {result} = renderHook(() => useCurrentUser());

        // Assert
        expect(result.current.data).toEqual(mockUserData);
        expect(result.current.isLoading).toBe(false);
        expect(mockUseQuery).toHaveBeenCalledWith(api.users.current);
    });

    it('should return null data and not loading when user is not authenticated', () => {
        // Arrange
        mockUseQuery.mockReturnValue(null);

        // Act
        const {result} = renderHook(() => useCurrentUser());

        // Assert
        expect(result.current.data).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(mockUseQuery).toHaveBeenCalledWith(api.users.current);
    });
});

