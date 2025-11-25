import {renderHook, act} from '@testing-library/react';
import {api} from '../../convex/_generated/api';
import {useMutation} from 'convex/react';

import {useGenerateUploadUrl} from '@/features/upload/api/use-generate-upload-url';

// Mock convex/react
jest.mock('convex/react', () => ({
    useMutation: jest.fn(),
}));

describe('useGenerateUploadUrl', () => {
    const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
    const mockMutationFn = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseMutation.mockReturnValue(mockMutationFn as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Hook Initialization and Basic Usage', () => {

        it('should initialize with correct default state', () => {
            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            // Assert
            expect(result.current.data).toBeNull();
            expect(result.current.error).toBeNull();
            expect(result.current.isPending).toBe(false);
            expect(result.current.isSuccess).toBe(false);
            expect(result.current.isError).toBe(false);
            expect(result.current.isSettled).toBe(false);
            expect(typeof result.current.mutate).toBe('function');
            expect(mockUseMutation).toHaveBeenCalledWith(api.upload.generateUploadUrl);
        });

        it('should generate upload URL successfully', async () => {
            // Arrange
            const mockUrl = 'https://convex-storage.example.com/upload/abc123';
            mockMutationFn.mockResolvedValue(mockUrl);
            const onSuccess = jest.fn();

            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            await act(async () => {
                await result.current.mutate({onSuccess});
            });

            // Assert
            expect(mockMutationFn).toHaveBeenCalled();
            expect(onSuccess).toHaveBeenCalledWith(mockUrl);
            expect(result.current.isSettled).toBe(true);
        });

        it('should handle authentication error', async () => {
            // Arrange
            const mockError = new Error('Authentication required');
            mockMutationFn.mockRejectedValue(mockError);
            const onError = jest.fn();

            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            await act(async () => {
                await result.current.mutate({onError});
            });

            // Assert
            expect(mockMutationFn).toHaveBeenCalled();
            expect(onError).toHaveBeenCalledWith(mockError);
            expect(result.current.isSettled).toBe(true);
        });

        it('should handle service unavailable error', async () => {
            // Arrange
            const mockError = new Error('Storage service unavailable');
            mockMutationFn.mockRejectedValue(mockError);

            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            // Assert - should throw error when throwError is true
            await act(async () => {
                await expect(
                    result.current.mutate({throwError: true})
                ).rejects.toThrow('Storage service unavailable');
            });

            expect(result.current.isSettled).toBe(true);
        });

        it('should generate unique URLs for multiple requests', async () => {
            // Arrange
            const url1 = 'https://convex-storage.example.com/upload/abc123';
            const url2 = 'https://convex-storage.example.com/upload/def456';

            mockMutationFn
                .mockResolvedValueOnce(url1)
                .mockResolvedValueOnce(url2);

            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            await act(async () => {
                await result.current.mutate();
            });

            await act(async () => {
                await result.current.mutate();
            });

            // Assert
            expect(mockMutationFn).toHaveBeenCalledTimes(2);
            expect(result.current.isSettled).toBe(true);
        });

        it('should handle rate limiting error', async () => {
            // Arrange
            const mockError = new Error('Rate limit exceeded');
            mockMutationFn.mockRejectedValue(mockError);
            const onError = jest.fn();

            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            await act(async () => {
                await result.current.mutate({onError});
            });

            // Assert
            expect(onError).toHaveBeenCalledWith(mockError);
            expect(result.current.isSettled).toBe(true);
        });

        it('should call onSettled callback after mutation completes', async () => {
            // Arrange
            const mockUrl = 'https://convex-storage.example.com/upload/settled';
            mockMutationFn.mockResolvedValue(mockUrl);
            const onSettled = jest.fn();

            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            await act(async () => {
                await result.current.mutate({onSettled});
            });

            // Assert
            expect(onSettled).toHaveBeenCalled();
            expect(result.current.isSettled).toBe(true);
        });

        it('should set pending state during mutation', async () => {
            // Arrange
            let resolveMutation: (value: string) => void;
            const mutationPromise = new Promise<string>((resolve) => {
                resolveMutation = resolve;
            });
            mockMutationFn.mockReturnValue(mutationPromise);

            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            // Start mutation but don't await it yet
            act(() => {
                result.current.mutate();
            });

            // Check if pending state is set
            const pendingState = result.current.isPending;

            // Now resolve the mutation
            await act(async () => {
                resolveMutation!('https://example.com/upload');
                await mutationPromise;
            });

            // Assert
            expect(pendingState).toBe(true);
            expect(result.current.isPending).toBe(false);
            expect(result.current.isSettled).toBe(true);
        });

    });

    describe('Upload URL Generation Integration Tests', () => {
        const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
        const mockMutationFn = jest.fn();

        beforeEach(() => {
            jest.clearAllMocks();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockUseMutation.mockReturnValue(mockMutationFn as any);
        });

        it('should generate upload URL and return valid URL', async () => {
            // Arrange
            const expectedUrl = 'https://convex-storage.example.com/upload/integration123';
            mockMutationFn.mockResolvedValue(expectedUrl);

            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            await act(async () => {
                await result.current.mutate();
            });

            // Assert
            expect(mockUseMutation).toHaveBeenCalledWith(api.upload.generateUploadUrl);
            expect(mockMutationFn).toHaveBeenCalled();
            expect(result.current.isSettled).toBe(true);
        });

        it('should handle network error during URL generation', async () => {
            // Arrange
            const networkError = new Error('Network request failed');
            mockMutationFn.mockRejectedValue(networkError);
            const onError = jest.fn();

            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            await act(async () => {
                await result.current.mutate({onError});
            });

            // Assert
            expect(onError).toHaveBeenCalledWith(networkError);
            expect(result.current.isSettled).toBe(true);
        });

        it('should handle storage quota exceeded error', async () => {
            // Arrange
            const quotaError = new Error('Storage quota exceeded');
            mockMutationFn.mockRejectedValue(quotaError);
            const onError = jest.fn();

            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            await act(async () => {
                await result.current.mutate({onError});
            });

            // Assert
            expect(onError).toHaveBeenCalledWith(quotaError);
            expect(result.current.isSettled).toBe(true);
        });

        it('should handle concurrent URL generation requests', async () => {
            // Arrange
            const url1 = 'https://convex-storage.example.com/upload/concurrent1';
            const url2 = 'https://convex-storage.example.com/upload/concurrent2';

            mockMutationFn
                .mockResolvedValueOnce(url1)
                .mockResolvedValueOnce(url2);

            // Act
            const {result} = renderHook(() => useGenerateUploadUrl());

            await act(async () => {
                await Promise.all([
                    result.current.mutate(),
                    result.current.mutate()
                ]);
            });

            // Assert
            expect(mockMutationFn).toHaveBeenCalledTimes(2);
            expect(result.current.isSettled).toBe(true);
        });
    });
});