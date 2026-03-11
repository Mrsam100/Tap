import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useBuilderStore } from '../useBuilderStore';

// Reset store between tests
beforeEach(() => {
  localStorage.clear();
  useBuilderStore.setState({
    siteData: {
      name: '',
      bio: '',
      links: [],
      socials: [],
      avatarImage: null,
      favicon: null,
      themeId: 'cream',
      fontId: 'serif',
      showFluidBackground: false,
      avatarInitials: '',
      seo: { title: '', description: '' },
      buttonStyle: { shape: 'rounded', fill: 'solid', shadow: 'none', color: '' },
      layout: 'stack',
      customBgType: null,
      customBgColor: '#6366f1',
      customBgUrl: null,
      ogImageUrl: null,
      removeBranding: false,
    },
    stage: 'input',
    activeTab: 'content',
    previewDevice: 'mobile',
    isPublished: false,
    isOffline: false,
    isAIProcessing: false,
    draggedItemIndex: null,
  });
});

describe('useBuilderStore', () => {
  it('starts with default state', () => {
    const state = useBuilderStore.getState();
    expect(state.siteData.name).toBe('');
    expect(state.siteData.links).toEqual([]);
    expect(state.stage).toBe('input');
    expect(state.activeTab).toBe('content');
  });

  it('updates site data partially', () => {
    const { setSiteData } = useBuilderStore.getState();
    setSiteData({ name: 'My Page', bio: 'Hello world' });

    const state = useBuilderStore.getState();
    expect(state.siteData.name).toBe('My Page');
    expect(state.siteData.bio).toBe('Hello world');
    expect(state.siteData.themeId).toBe('cream'); // unchanged
  });

  it('adds a block', () => {
    const { addBlock } = useBuilderStore.getState();
    addBlock('button');

    const state = useBuilderStore.getState();
    expect(state.siteData.links).toHaveLength(1);
    expect(state.siteData.links[0].type).toBe('button');
    expect(state.siteData.links[0].label).toBe('New Block');
    expect(state.siteData.links[0].active).toBe(true);
  });

  it('adds a product block with default fields', () => {
    const { addBlock } = useBuilderStore.getState();
    addBlock('product');

    const block = useBuilderStore.getState().siteData.links[0];
    expect(block.type).toBe('product');
    expect(block.price).toBe('$0.00');
    expect(block.image).toBeDefined();
  });

  it('adds a video block with default embed URL', () => {
    const { addBlock } = useBuilderStore.getState();
    addBlock('video');

    const block = useBuilderStore.getState().siteData.links[0];
    expect(block.type).toBe('video');
    expect(block.embedUrl).toBeDefined();
  });

  it('removes a link', () => {
    const { addBlock, removeLink } = useBuilderStore.getState();
    addBlock('button');
    const linkId = useBuilderStore.getState().siteData.links[0].id;
    removeLink(linkId);

    expect(useBuilderStore.getState().siteData.links).toHaveLength(0);
  });

  it('updates a link field', () => {
    const { addBlock, updateLink } = useBuilderStore.getState();
    addBlock('button');
    const linkId = useBuilderStore.getState().siteData.links[0].id;

    updateLink(linkId, 'label', 'Updated Label');
    expect(useBuilderStore.getState().siteData.links[0].label).toBe('Updated Label');
  });

  it('updates link style fields', () => {
    const { addBlock, updateLink } = useBuilderStore.getState();
    addBlock('button');
    const linkId = useBuilderStore.getState().siteData.links[0].id;

    updateLink(linkId, 'fontSize', 'lg');
    expect(useBuilderStore.getState().siteData.links[0].style.fontSize).toBe('lg');
  });

  it('adds and removes socials', () => {
    useBuilderStore.getState().addSocial('twitter');
    expect(useBuilderStore.getState().siteData.socials).toHaveLength(1);

    useBuilderStore.getState().addSocial('instagram');
    expect(useBuilderStore.getState().siteData.socials).toHaveLength(2);

    // Duplicate add should be ignored
    useBuilderStore.getState().addSocial('twitter');
    expect(useBuilderStore.getState().siteData.socials).toHaveLength(2);

    const twitterId = useBuilderStore.getState().siteData.socials.find(s => s.platform === 'twitter')!.id;
    useBuilderStore.getState().removeSocial(twitterId);
    expect(useBuilderStore.getState().siteData.socials).toHaveLength(1);
    expect(useBuilderStore.getState().siteData.socials[0].platform).toBe('instagram');
  });

  it('updates social URL', () => {
    const { addSocial, updateSocial } = useBuilderStore.getState();
    addSocial('github');
    const id = useBuilderStore.getState().siteData.socials[0].id;

    updateSocial(id, 'https://github.com/test');
    expect(useBuilderStore.getState().siteData.socials[0].url).toBe('https://github.com/test');
  });

  it('reorders links', () => {
    const { addBlock, reorderLinks } = useBuilderStore.getState();
    addBlock('button');
    addBlock('video');
    addBlock('product');

    const ids = useBuilderStore.getState().siteData.links.map(l => l.id);
    reorderLinks(0, 2);

    const newIds = useBuilderStore.getState().siteData.links.map(l => l.id);
    expect(newIds[0]).toBe(ids[1]);
    expect(newIds[2]).toBe(ids[0]);
  });

  it('sets UI state', () => {
    const state = useBuilderStore.getState();
    state.setStage('editor');
    state.setActiveTab('design');
    state.setPreviewDevice('desktop');
    state.setIsPublished(true);

    const updated = useBuilderStore.getState();
    expect(updated.stage).toBe('editor');
    expect(updated.activeTab).toBe('design');
    expect(updated.previewDevice).toBe('desktop');
    expect(updated.isPublished).toBe(true);
  });

  it('persists immediately via replaceSiteData', () => {
    const { replaceSiteData } = useBuilderStore.getState();
    replaceSiteData({ ...useBuilderStore.getState().siteData, name: 'Test Page' });

    const saved = localStorage.getItem('tap_builder_data_v2');
    expect(saved).toBeTruthy();
    expect(JSON.parse(saved!).name).toBe('Test Page');
  });

  it('writes to localStorage immediately for setSiteData (cache for offline)', () => {
    const { setSiteData } = useBuilderStore.getState();
    setSiteData({ name: 'Cached' });

    // localStorage is written immediately as offline cache
    const saved = localStorage.getItem('tap_builder_data_v2');
    expect(saved).toBeTruthy();
    expect(JSON.parse(saved!).name).toBe('Cached');
  });

  it('does not persist when name is empty', () => {
    vi.useFakeTimers();
    const { setSiteData } = useBuilderStore.getState();
    setSiteData({ bio: 'Just a bio, no name' });
    vi.advanceTimersByTime(350);

    const saved = localStorage.getItem('tap_builder_data_v2');
    expect(saved).toBeNull();
    vi.useRealTimers();
  });

  it('persists immediately for addBlock', () => {
    // First set a name so persistence works
    useBuilderStore.getState().replaceSiteData({ ...useBuilderStore.getState().siteData, name: 'Test' });
    useBuilderStore.getState().addBlock('button');

    const saved = localStorage.getItem('tap_builder_data_v2');
    expect(saved).toBeTruthy();
    expect(JSON.parse(saved!).links).toHaveLength(1);
  });

  it('clones page to separate storage key', () => {
    const { replaceSiteData, clonePage } = useBuilderStore.getState();
    replaceSiteData({ ...useBuilderStore.getState().siteData, name: 'Clone Me' });
    clonePage();

    const cloned = localStorage.getItem('tap_cloned_page');
    expect(cloned).toBeTruthy();
    expect(JSON.parse(cloned!).name).toBe('Clone Me');
  });
});
