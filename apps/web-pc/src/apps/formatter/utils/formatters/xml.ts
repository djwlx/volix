import { tryParseNestedStringValue } from '../nested';

const indentMultiline = (value: string, level: number) => {
  const indent = '  '.repeat(level);
  return value
    .split('\n')
    .map(line => `${indent}${line}`)
    .join('\n');
};

const formatNestedTextBlock = (value: string, level: number) => {
  const nested = tryParseNestedStringValue(value);
  if (!nested) {
    return null;
  }

  return indentMultiline(nested.formatted, level);
};

const formatXmlNode = (node: Node, level = 0): string => {
  const indent = '  '.repeat(level);

  if (node.nodeType === Node.TEXT_NODE) {
    const content = node.textContent?.trim();
    if (!content) {
      return '';
    }

    const nestedText = formatNestedTextBlock(content, level);
    return `${nestedText || `${indent}${content}`}\n`;
  }

  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `${indent}<![CDATA[${node.textContent || ''}]]>\n`;
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    return `${indent}<!--${node.textContent || ''}-->\n`;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as Element;
  const attrs = Array.from(element.attributes)
    .map(attr => `${attr.name}="${attr.value}"`)
    .join(' ');
  const openTag = attrs ? `<${element.tagName} ${attrs}>` : `<${element.tagName}>`;
  const children = Array.from(element.childNodes).filter(child => {
    if (child.nodeType !== Node.TEXT_NODE) {
      return true;
    }
    return Boolean(child.textContent?.trim());
  });

  if (!children.length) {
    return `${indent}${attrs ? `<${element.tagName} ${attrs} />` : `<${element.tagName} />`}\n`;
  }

  if (children.length === 1 && children[0]?.nodeType === Node.TEXT_NODE) {
    const textContent = children[0].textContent?.trim() || '';
    const nestedText = formatNestedTextBlock(textContent, level + 1);

    if (nestedText) {
      return `${indent}${openTag}\n${nestedText}\n${indent}</${element.tagName}>\n`;
    }

    return `${indent}${openTag}${textContent}</${element.tagName}>\n`;
  }

  const childContent = children.map(child => formatXmlNode(child, level + 1)).join('');
  return `${indent}${openTag}\n${childContent}${indent}</${element.tagName}>\n`;
};

export function formatXml(value: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, 'application/xml');
  const errorNode = doc.querySelector('parsererror');

  if (errorNode) {
    throw new Error(errorNode.textContent?.trim() || 'XML 格式不正确');
  }

  if (!doc.documentElement) {
    throw new Error('XML 内容为空');
  }

  const xmlDeclarationMatch = value.trim().match(/^<\?xml[\s\S]*?\?>/);
  const xmlDeclaration = xmlDeclarationMatch ? `${xmlDeclarationMatch[0]}\n` : '';
  return `${xmlDeclaration}${formatXmlNode(doc.documentElement)}`.trim();
}
