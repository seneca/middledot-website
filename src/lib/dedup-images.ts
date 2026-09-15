import { visit } from 'unist-util-visit';

console.log('[dedupImages] module loaded');

export function dedupImages() {
  console.log('[dedupImages] factory called');
  return function (tree, vfile) {
    console.log('[dedupImages] transformer called');
    const images = vfile.data.astro?.frontmatter?.images || [];
    console.log('[dedupImages] frontmatter images:', images);
    if (images.length === 0) return;

    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const src = String(node.properties.src || '');
      if (!src) return;

      const isDuplicate = images.some((img) => {
        const imgStr = String(img);
        return src === imgStr || src.endsWith(imgStr) || imgStr.endsWith(src);
      });
      if (!isDuplicate) return;

      const className = node.properties.className;
      const hasFullWidth =
        (Array.isArray(className) && className.includes('full-width')) ||
        className === 'full-width';
      if (hasFullWidth) return;

      return visit.REMOVE;
    });
  };
}