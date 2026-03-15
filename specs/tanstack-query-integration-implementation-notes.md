# TanStack Query Integration - Implementation Notes

## Implementation Summary

Successfully integrated TanStack Query v5 into the RAG chatbot application to replace manual fetch logic with `useQuery` and `useMutation` hooks.

## Files Created

1. **`lib/query-client.ts`** - QueryClient configuration with factory functions for proper Next.js integration:
   - `makeQueryClient()` - Creates a new QueryClient instance
   - `getQueryClient()` - Returns a cached QueryClient for client-side, creates new for server-side
   - Default stale time: 5 minutes
   - Default cache time (gcTime): 10 minutes
   - Default retry: 3 attempts with exponential backoff
   - Default refetch on window focus: true
   - Default refetch on reconnect: true

2. **`components/Providers.tsx`** - Client-side provider component that wraps the application with QueryClientProvider and ReactQueryDevtools
   - Default stale time: 5 minutes
   - Default cache time (gcTime): 10 minutes
   - Default retry: 3 attempts with exponential backoff
   - Default refetch on window focus: true
   - Default refetch on reconnect: true

2. **`lib/hooks/use-document-download.ts`** - Custom hook for document downloads using useMutation

## Files Modified

1. **`app/layout.tsx`** - Updated to use Providers component instead of direct QueryClientProvider

2. **`components/DocumentList/DocumentList.tsx`** - Refactored with:
   - `useQuery(['documents-stats'])` for fetching document stats
   - `useQuery(['documents-list'])` for fetching document list
   - `useMutation(['delete-document'])` for document deletion with optimistic updates
   - Query invalidation on mutation success
   - Manual loading states replaced with TanStack Query's `isLoading`, `isFetching`, `isPending`

3. **`components/Upload/Upload.tsx`** - Refactored with:
   - `useMutation(['upload-document'])` for file uploads
   - Progress tracking preserved in mutation lifecycle
   - Query invalidation on success (`documents-stats`, `documents-list`)
   - `documentUploaded` custom event dispatch maintained for backward compatibility

4. **`app/UploadWrapper.tsx`** - Refactored with:
   - `useQuery(['documents-formats'])` for fetching supported formats
   - Fallback to default formats on error
   - Removed manual useEffect for data fetching

5. **`package.json`** - Added dependencies:
   - `@tanstack/react-query@latest`
   - `@tanstack/react-query-devtools@latest` (dev dependency)

## Design Decisions Followed

1. **Minimal Abstraction**: Used `useQuery` and `useMutation` directly in components rather than creating a complex abstraction layer

2. **App-Level QueryClientProvider**: Single provider at the root enables query cache sharing across the entire application

3. **Next.js 14 Compatibility**: Created a Providers client component to properly handle QueryClient lifecycle, avoiding issues with passing instances from Server to Client Components

3. **Preserved SSE Streaming**: Chat component maintains custom fetch implementation with ReadableStream for streaming responses

4. **Custom Event Dispatching**: Maintained `CustomEvent` dispatching for immediate UI updates while using query invalidation for cache consistency

## Cache Management

- **Stats Query**: `['documents-stats']` - invalidated after upload and delete mutations
- **List Query**: `['documents-list']` - invalidated after upload and delete mutations
- **Formats Query**: `['documents-formats']` - refetched on component mount
- **Delete Mutation**: Uses optimistic updates with rollback on error
- **Upload Mutation**: Preserves progress tracking while using mutation lifecycle

## Error Handling

- TanStack Query's automatic retry mechanism (3 attempts with exponential backoff)
- Error states exposed via `error` property from queries and mutations
- User-friendly error messages displayed in UI
- Console logging preserved for debugging

## Loading States

- Replaced manual `isUploading`, `initialLoading`, `refreshing`, `listLoading` states with:
  - `isLoading` - initial query loading
  - `isFetching` - query refetching
  - `isPending` - mutation in progress
- Visual loading indicators (spinners, progress bars) preserved

## Testing Results

- ✅ TypeScript type check passes
- ✅ ESLint passes with no warnings or errors
- ✅ Production build completes successfully

## Known Limitations

1. **SSE Streaming**: TanStack Query v5 does not support streaming responses natively. The Chat component maintains custom fetch implementation.

2. **Progress Tracking**: TanStack Query's `useMutation` does not provide built-in progress tracking. Progress tracking is implemented within mutation lifecycle callbacks.

3. **Cache Persistence**: TanStack Query's cache is in-memory only. Page reload will refetch all data.

## Future Enhancements

1. **Infinite Queries**: Implement pagination for document lists if needed
2. **Cache Persistence**: Add `@tanstack/react-query-persist-client` for offline support
3. **Real-time Updates**: Consider integrating websockets for true real-time document updates

## Configuration

### Environment Variables

No additional environment variables required for TanStack Query. Default configuration is set in `lib/query-client.ts`.

### DevTools

React Query DevTools are available in development mode and can be accessed via the floating button in the bottom-right corner of the screen.

## Backward Compatibility

- API routes remain unchanged
- Response formats remain identical
- UI/UX remains unchanged
- SSE streaming continues to work
- `documentUploaded` custom events still dispatched for document uploads

## Performance

- Automatic deduplication of concurrent queries
- Cache hits eliminate unnecessary API calls
- Optimistic updates improve perceived performance
- Bundle size increase: ~42KB gzipped (within the <50KB target)
