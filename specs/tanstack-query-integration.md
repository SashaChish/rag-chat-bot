# TanStack Query Integration Specification

## Feature Overview

### Purpose
Integrate TanStack Query v5 into the RAG chatbot to provide a robust, standardized solution for server state management, replacing custom fetch logic with `useQuery` and `useMutation` hooks.

### Goals
- Replace manual `fetch()` calls with TanStack Query's declarative data fetching
- Eliminate redundant loading state management across components
- Implement consistent error handling and retry logic
- Reduce code duplication through shared query configuration
- Maintain existing SSE streaming functionality in Chat component
- Leverage TanStack Query's automatic caching and refetching

### Scope
This refactoring affects:
- All client components (`Chat.tsx`, `Upload.tsx`, `DocumentList.tsx`, `UploadWrapper.tsx`)
- API client interactions with `/api/documents`, `/api/documents/[id]`, and `/api/documents?action=list`
- Query client configuration and setup
- Loading and error state patterns

### Out of Scope
- Backend API route modifications
- SSE streaming refactoring in Chat component (will continue using custom fetch)
- Database or vector store changes
- UI/UX redesign (maintaining existing look and feel)

---

## Requirements

### Functional Requirements

#### FR1: TanStack Query Setup
- **FR1.1**: Install `@tanstack/react-query` v5 as a project dependency
- **FR1.2**: Create `QueryClient` instance in `/lib/query-client.ts`
- **FR1.3**: Configure `QueryClient` with:
  - Default stale time: 5 minutes
  - Default cache time: 10 minutes
  - Default retry: 3 attempts with exponential backoff
  - Default refetch on window focus: true
  - Default refetch on reconnect: true
- **FR1.4**: Wrap the application with `QueryClientProvider` in `/app/layout.tsx`
- **FR1.5**: Support DevTools in development mode (optional, configure via environment variable)

#### FR2: Document Management - Query Hooks
- **FR2.1**: Replace `DocumentList.tsx` stats fetch with `useQuery`
  - Query key: `['documents-stats']`
  - Refetch interval: None (manual or event-driven)
  - Enabled: true
- **FR2.2**: Replace `DocumentList.tsx` document list fetch with `useQuery`
  - Query key: `['documents-list']`
  - Refetch interval: None (manual or event-driven)
  - Enabled: true
- **FR2.3**: Replace `UploadWrapper.tsx` supported formats fetch with `useQuery`
  - Query key: `['documents-formats']`
  - Refetch interval: None (manual or event-driven)
  - Enabled: true

#### FR3: Document Management - Mutation Hooks
- **FR3.1**: Replace `Upload.tsx` file upload with `useMutation`
  - Mutation key: `['upload-document']`
  - On success: Invalidate `['documents-stats']`, `['documents-list']` queries
  - On success: Dispatch `documentUploaded` custom event for DocumentList
  - Preserve progress tracking functionality
- **FR3.2**: Replace `DocumentList.tsx` document deletion with `useMutation`
  - Mutation key: `['delete-document']`
  - On success: Invalidate `['documents-stats']`, `['documents-list']` queries
  - Optimistic updates: Remove document from list immediately
- **FR3.3**: Create `useDocumentDownload` mutation for file downloads
  - Mutation key: `['download-document']`
  - Preserve existing download functionality

#### FR4: Chat Component Refactoring
- **FR4.1**: Keep existing SSE streaming implementation (direct fetch with `ReadableStream`)
- **FR4.2**: Optionally wrap streaming request in `useMutation` for consistent loading states
- **FR4.3**: Maintain conversation history state in component
- **FR4.4**: Preserve error handling and retry behavior for chat messages

#### FR5: Loading State Management
- **FR5.1**: Use `isLoading`, `isFetching` from TanStack Query instead of manual loading states
- **FR5.2**: Use `isPending` from mutations for upload and delete operations
- **FR5.3**: Replace multiple loading state variables (`initialLoading`, `refreshing`, `listLoading`) with TanStack Query's state flags
- **FR5.4**: Preserve visual loading indicators (spinners, progress bars)

#### FR6: Error Handling
- **FR6.1**: Use `error` from TanStack Query instead of manual error state
- **FR6.2**: Display user-friendly error messages based on error type
- **FR6.3**: Configure automatic retry for failed queries (3 attempts with exponential backoff)
- **FR6.4**: Implement error boundaries for catastrophic failures
- **FR6.5**: Preserve console logging for debugging

#### FR7: Cache Management
- **FR7.1**: Implement query invalidation after mutations
  - Upload: Invalidate `documents-stats`, `documents-list`
  - Delete: Invalidate `documents-stats`, `documents-list`
- **FR7.2**: Use `setQueryData` for optimistic updates on document deletion
- **FR7.3**: Configure stale time to prevent unnecessary refetches
- **FR7.4**: Support manual refetch via button click (refresh functionality)

#### FR8: Event-Driven Updates
- **FR8.1**: Maintain `CustomEvent` dispatching for document uploads
- **FR8.2**: Use `invalidateQueries` as primary invalidation mechanism
- **FR8.3**: Optionally replace custom events with TanStack Query's cache updates (future consideration)

### Non-Functional Requirements

#### NFR1: Performance
- **NFR1.1**: Lazy query loading - queries should only fetch when components mount
- **NFR1.2**: Cache hits should eliminate unnecessary API calls
- **NFR1.3**: Optimistic updates should improve perceived performance
- **NFR1.4**: Bundle size increase should be minimal (<50KB gzipped)

#### NFR2: Developer Experience
- **NFR2.1**: TypeScript types should be fully compatible with existing types
- **NFR2.2**: Query and mutation keys should be strongly typed
- **NFR2.3**: Code should be readable and maintainable
- **NFR2.4**: Minimize abstraction - use `useQuery`/`useMutation` directly in components

#### NFR3: Backward Compatibility
- **NFR3.1**: API routes must not change
- **NFR3.2**: Response formats must remain identical
- **NFR3.3**: UI/UX must remain unchanged
- **NFR3.4**: SSE streaming must continue working

#### NFR4: Reliability
- **NFR4.1**: Automatic retry on network failures
- **NFR4.2**: Graceful degradation when API is unavailable
- **NFR4.3**: Error messages should be clear and actionable

#### NFR5: Code Quality
- **NFR5.1**: Follow existing code conventions (PascalCase components, lowercase lib modules)
- **NFR5.2**: No `any` types - use proper TypeScript definitions
- **NFR5.3**: Descriptive names over comments
- **NFR5.4**: Pass ESLint checks

---

## Architecture

### Design Decisions

#### Decision 1: Minimal Abstraction
**Rationale**: Keep code simple and maintainable by using `useQuery` and `useMutation` directly in components rather than creating a complex abstraction layer.

**Implementation**: Each component will use TanStack Query hooks directly with minimal shared utilities.

#### Decision 2: App-Level QueryClientProvider
**Rationale**: Single provider at the root enables query cache sharing across the entire application, reducing redundant API calls and improving performance.

**Implementation**: Add `QueryClientProvider` to `/app/layout.tsx` with a `QueryClient` instance created in `/lib/query-client.ts`.

#### Decision 3: Preserve SSE Streaming
**Rationale**: TanStack Query v5 does not natively support streaming responses. The existing SSE implementation works well and provides a better user experience.

**Implementation**: Keep direct fetch with `ReadableStream` in `Chat.tsx`. Optionally wrap in `useMutation` for consistent loading states.

#### Decision 4: Custom Event Dispatching
**Rationale**: The existing `CustomEvent` system for document uploads provides a simple, event-driven architecture. Transitioning to pure cache invalidation would require significant refactoring.

**Implementation**: Maintain `CustomEvent` dispatching for immediate UI updates while using query invalidation for cache consistency.

### Component Refactoring

#### Component: `DocumentList.tsx`

**Current State**:
```typescript
const [initialLoading, setInitialLoading] = useState(true);
const [stats, setStats] = useState(null);
const [documents, setDocuments] = useState([]);
const [error, setError] = useState(null);
```

**Refactored State**:
```typescript
const statsQuery = useQuery({
  queryKey: ['documents-stats'],
  queryFn: () => fetch('/api/documents').then(r => r.json()),
});

const documentsQuery = useQuery({
  queryKey: ['documents-list'],
  queryFn: () => fetch('/api/documents?action=list').then(r => r.json()),
});

const deleteMutation = useMutation({
  mutationFn: (id: string) => fetch(`/api/documents/${id}`, { method: 'DELETE' }).then(r => r.json()),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['documents-list'] });
    const previousDocuments = queryClient.getQueryData(['documents-list']);
    queryClient.setQueryData(['documents-list'], (old: DocumentListEntry[]) =>
      old.filter(doc => doc.id !== id)
    );
    return { previousDocuments };
  },
  onError: (err, id, context) => {
    queryClient.setQueryData(['documents-list'], context.previousDocuments);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['documents-stats'] });
  },
});
```

#### Component: `Upload.tsx`

**Current State**:
```typescript
const [isUploading, setIsUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
```

**Refactored State**:
```typescript
const uploadMutation = useMutation({
  mutationFn: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // Progress tracking implementation
    const response = await fetch('/api/documents', {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['documents-stats'] });
    queryClient.invalidateQueries({ queryKey: ['documents-list'] });
    window.dispatchEvent(new CustomEvent('documentUploaded'));
  },
});
```

#### Component: `UploadWrapper.tsx`

**Current State**:
```typescript
const [supportedFormats, setSupportedFormats] = useState([]);

useEffect(() => {
  async function fetchSupportedFormats() {
    const response = await fetch('/api/documents');
    const data = await response.json();
    setSupportedFormats(data.supportedFormats || []);
  }
  fetchSupportedFormats();
}, []);
```

**Refactored State**:
```typescript
const formatsQuery = useQuery({
  queryKey: ['documents-formats'],
  queryFn: () => fetch('/api/documents').then(r => r.json()),
  select: (data) => data.supportedFormats || [],
});
```

### Data Flow

#### Query Flow
```
Component Mount → useQuery hook → Check cache → If stale or missing → API Request → Cache Update → Component Re-render
```

#### Mutation Flow
```
User Action → useMutation hook → API Request → On Success → Invalidate Queries → Cache Update → Components Re-render
```

#### Optimistic Update Flow
```
User Action → onMutate → Update Cache (optimistic) → Component Re-render → API Request → On Error → Rollback Cache
```

### File Structure

```
lib/
  query-client.ts           # QueryClient instance and configuration
  api/                      # API helper utilities (optional, minimal)
    documents.ts            # Document-specific API functions
    queries.ts              # Query key definitions (optional)

components/
  Chat.tsx                  # Refactored with optional useMutation for streaming
  Upload.tsx                # Refactored with useMutation for upload
  DocumentList.tsx          # Refactored with useQuery and useMutation
  UploadWrapper.tsx         # Refactored with useQuery

app/
  layout.tsx                # Updated to include QueryClientProvider
```

---

## Edge Cases

### Error Handling

#### E1: Network Errors
- **Scenario**: User loses internet connection during API call
- **Handling**: TanStack Query automatically retries 3 times with exponential backoff
- **UI**: Display "Network error - retrying..." message, then full error after retries exhausted

#### E2: Server Errors (5xx)
- **Scenario**: API returns 500 error
- **Handling**: TanStack Query retries up to configured limit (default: 3)
- **UI**: Display "Server error - please try again later" message

#### E3: Client Errors (4xx)
- **Scenario**: User uploads invalid file type
- **Handling**: No retry, display error immediately
- **UI**: Display specific validation error message from API

#### E4: Concurrent Mutations
- **Scenario**: User uploads multiple files simultaneously
- **Handling**: Each mutation has its own loading state and success/error handling
- **UI**: Show individual progress for each file upload

#### E5: Optimistic Update Rollback
- **Scenario**: Delete mutation fails after optimistic update
- **Handling**: Restore previous document list from cache
- **UI**: Brief flash of deleted item, then reappears with error message

### Validation

#### V1: File Upload Validation
- **Scenario**: User uploads file larger than max size (10MB)
- **Handling**: Client-side validation before mutation, API validation as backup
- **UI**: Display "File too large" error message, prevent upload

#### V2: Document ID Validation
- **Scenario**: Invalid document ID passed to delete mutation
- **Handling**: API returns 404 error
- **UI**: Display "Document not found" error message

#### V3: Empty State
- **Scenario**: No documents in the system
- **Handling**: Query returns empty array, stats show 0 documents
- **UI**: Display empty state message in DocumentList

### Race Conditions

#### R1: Concurrent Fetches
- **Scenario**: User rapidly clicks refresh button
- **Handling**: TanStack Query deduplicates concurrent queries with same key
- **UI**: Show single loading state

#### R2: Stale Data
- **Scenario**: User views document list while another user uploads a document
- **Handling**: Configure refetch on window focus, provide manual refresh button
- **UI**: Update when user focuses window or clicks refresh

---

## Testing Strategy

### Unit Tests

#### T1: Query Client Configuration
- Verify `QueryClient` is initialized with correct default options
- Verify `QueryClientProvider` wraps the application
- Verify DevTools are available in development mode

#### T2: Query Hooks
- Test `useQuery` returns correct data from API
- Test `useQuery` caches responses
- Test `useQuery` refetches on invalidation
- Test `useQuery` handles errors correctly

#### T3: Mutation Hooks
- Test `useMutation` sends correct request to API
- Test `useMutation` invalidates related queries on success
- Test `useMutation` handles errors correctly
- Test optimistic updates rollback on error

### Integration Tests

#### I1: Document Management Flow
- Upload document → Verify stats and list queries are invalidated → Verify DocumentList updates
- Delete document → Verify stats and list queries are invalidated → Verify optimistic update → Verify DocumentList updates

#### I2: Error Recovery
- Simulate network error → Verify retry mechanism → Verify error display
- Simulate server error → Verify retry limit → Verify error display
- Verify retry works across component unmount/remount

#### I3: Cache Behavior
- Fetch data → Navigate away → Navigate back → Verify cache hit (no API call)
- Fetch data → Manually invalidate → Verify refetch
- Fetch data → Wait for stale time → Verify no automatic refetch

### End-to-End Tests

#### E1: Full User Workflow
- User navigates to app → DocumentList loads → User uploads file → DocumentList updates → User deletes file → DocumentList updates

#### E2: Error Scenarios
- User tries to upload invalid file → Verify error message
- User loses connection during upload → Verify retry and error handling
- User refreshes page → Verify cache persistence

#### E3: Performance
- Measure initial page load time
- Measure time to cache hit vs cache miss
- Verify no redundant API calls

---

## Implementation Notes

### Phase 1: Setup and Configuration
1. Install `@tanstack/react-query@latest`
2. Create `lib/query-client.ts` with `QueryClient` configuration
3. Update `app/layout.tsx` to include `QueryClientProvider`
4. Optionally configure DevTools for development

### Phase 2: DocumentList Refactoring
1. Replace stats fetch with `useQuery(['documents-stats'])`
2. Replace document list fetch with `useQuery(['documents-list'])`
3. Replace delete operation with `useMutation(['delete-document'])`
4. Implement optimistic updates for document deletion
5. Configure query invalidation on mutation success
6. Update error handling to use TanStack Query's `error` property
7. Remove manual loading states, use `isLoading` and `isFetching`

### Phase 3: Upload Component Refactoring
1. Replace upload operation with `useMutation(['upload-document'])`
2. Implement query invalidation on success
3. Preserve progress tracking functionality
4. Dispatch `documentUploaded` event for backward compatibility
5. Update error handling

### Phase 4: UploadWrapper Refactoring
1. Replace supported formats fetch with `useQuery(['documents-formats'])`
2. Remove `useEffect` for data fetching
3. Update error handling

### Phase 5: Chat Component (Optional)
1. Consider wrapping streaming request in `useMutation` for consistency
2. Maintain existing SSE streaming implementation
3. Preserve conversation history state

### Phase 6: Testing and Validation
1. Write unit tests for query and mutation hooks
2. Write integration tests for document management flow
3. Write E2E tests for full user workflows
4. Performance testing
5. Browser testing (Chrome, Firefox, Safari)

### Type Definitions

Use existing type definitions in `lib/types/`:
- `DocumentListEntry` - Document metadata
- `IndexStats` - Document statistics
- `SupportedFormat` - File format information

Query keys should be defined as constants for type safety:
```typescript
// lib/query-keys.ts (optional)
export const queryKeys = {
  documents: {
    all: ['documents'] as const,
    stats: () => ['documents-stats'] as const,
    list: () => ['documents-list'] as const,
    formats: () => ['documents-formats'] as const,
  },
};
```

### Migration Checklist

- [ ] Install @tanstack/react-query
- [ ] Create QueryClient configuration
- [ ] Add QueryClientProvider to layout
- [ ] Refactor DocumentList queries
- [ ] Refactor DocumentList mutations
- [ ] Refactor Upload mutations
- [ ] Refactor UploadWrapper queries
- [ ] Update error handling across components
- [ ] Remove redundant loading states
- [ ] Test query invalidation
- [ ] Test optimistic updates
- [ ] Test error scenarios
- [ ] Performance testing
- [ ] Cross-browser testing

### Known Limitations

1. **SSE Streaming**: TanStack Query v5 does not support streaming responses natively. The custom fetch implementation in Chat component must be maintained.

2. **Progress Tracking**: TanStack Query's `useMutation` does not provide built-in progress tracking. The existing progress tracking implementation must be preserved.

3. **Cache Persistence**: TanStack Query's cache is in-memory only. Page reload will refetch all data. Consider adding `@tanstack/react-query-persist-client` if persistence is needed in the future.

4. **Real-time Updates**: The current implementation relies on `CustomEvent` for real-time updates. Consider implementing TanStack Query's mutation observers or websockets in the future for true real-time updates.

### Future Enhancements

1. **Infinite Queries**: Implement pagination for document lists if needed
2. **Prefetching**: Prefetch document data on hover to improve perceived performance
3. **Cache Persistence**: Add offline support with persistent cache
4. **Real-time Updates**: Integrate websockets for true real-time document updates
5. **Mutation Observers**: Use mutation observers for complex state synchronization
6. **Suspense Mode**: Enable React Suspense integration for cleaner async code
