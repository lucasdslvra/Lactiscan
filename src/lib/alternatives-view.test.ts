import { describe, expect, it } from '@jest/globals';

import { alternativesView, type AlternativesViewInput } from '@/lib/alternatives-view';
import { OffHttpError, OffNetworkError } from '@/lib/off';

const IDLE: AlternativesViewInput = {
  hasCategory: true,
  isPending: false,
  isLoadingMore: false,
  error: null,
  count: 0,
};

const offline = new OffNetworkError();

describe('alternativesView', () => {
  it('shows a spinner while the search runs', () => {
    expect(alternativesView({ ...IDLE, isPending: true })).toEqual({ kind: 'loading' });
  });

  it('keeps the spinner while the parent category is searched with nothing to show yet', () => {
    expect(alternativesView({ ...IDLE, isLoadingMore: true })).toEqual({ kind: 'loading' });
  });

  it('lists the results, with a progress indicator while more are coming', () => {
    expect(alternativesView({ ...IDLE, count: 2 })).toEqual({ kind: 'list', loadingMore: false });
    expect(alternativesView({ ...IDLE, count: 1, isLoadingMore: true })).toEqual({
      kind: 'list',
      loadingMore: true,
    });
  });

  it('tells a network error from « aucune alternative trouvée »', () => {
    expect(alternativesView({ ...IDLE, error: offline })).toEqual({ kind: 'error', error: offline });
    expect(alternativesView(IDLE)).toEqual({ kind: 'empty', reason: 'no-match' });
  });

  it('shows a server error the same way, with its retry', () => {
    const unavailable = new OffHttpError(503);
    expect(alternativesView({ ...IDLE, error: unavailable })).toEqual({
      kind: 'error',
      error: unavailable,
    });
  });

  it('never hides results already shown behind an error', () => {
    expect(alternativesView({ ...IDLE, count: 3, error: offline })).toEqual({
      kind: 'list',
      loadingMore: false,
    });
  });

  it('says when the product has no category to search', () => {
    expect(alternativesView({ ...IDLE, hasCategory: false })).toEqual({
      kind: 'empty',
      reason: 'no-category',
    });
  });
});
