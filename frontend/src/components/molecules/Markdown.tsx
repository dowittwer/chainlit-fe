/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useMemo, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import { PluggableList } from 'react-markdown/lib';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';
import { VegaLite } from 'react-vega';

import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { InlineCode } from 'components/atoms/InlineCode';
import { Code } from 'components/molecules/Code';
import { MermaidDiagram } from './Mermaid';
import { ElementRef } from 'components/molecules/messages/components/ElementRef';

import type { IMessageElement } from 'client-types/';

import ResponseTextItem from '@chainlit/copilot/src/evoya/privacyShield/ResponseTextItem';
import BlinkingCursor from './BlinkingCursor';

interface Props {
  allowHtml?: boolean;
  latex?: boolean;
  refElements?: IMessageElement[];
  children: string;
}

const cursorPlugin = () => {
  return (tree: any) => {
    visit(tree, 'text', (node: any, index, parent) => {
      const placeholderPattern = /\u200B/g;
      const matches = [...(node.value?.matchAll(placeholderPattern) || [])];

      if (matches.length > 0) {
        const newNodes: any[] = [];
        let lastIndex = 0;

        matches.forEach((match) => {
          const [fullMatch] = match;
          const startIndex = match.index!;
          const endIndex = startIndex + fullMatch.length;

          if (startIndex > lastIndex) {
            newNodes.push({
              type: 'text',
              value: node.value!.slice(lastIndex, startIndex)
            });
          }

          newNodes.push({
            type: 'blinkingCursor',
            data: {
              hName: 'blinkingCursor',
              hProperties: { text: 'Blinking Cursor' }
            }
          });

          lastIndex = endIndex;
        });

        if (lastIndex < node.value!.length) {
          newNodes.push({
            type: 'text',
            value: node.value!.slice(lastIndex)
          });
        }

        parent!.children.splice(index, 1, ...newNodes);
      }
    });
  };
};

function Markdown({ refElements, allowHtml, latex, children }: Props) {
  const rehypePlugins = useMemo(() => {
    let rehypePlugins: PluggableList = [];
    if (allowHtml) {
      rehypePlugins = [rehypeRaw as any, ...rehypePlugins];
    }
    if (latex) {
      rehypePlugins = [[rehypeKatex as any, { output: 'mathml' }], ...rehypePlugins];
    }
    return rehypePlugins;
  }, [allowHtml, latex]);

  const remarkPlugins = useMemo(() => {
    let remarkPlugins: PluggableList = [cursorPlugin, remarkGfm as any];
    if (latex) {
      remarkPlugins = [...remarkPlugins, remarkMath as any];
    }
    return remarkPlugins;
  }, [latex]);

  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      className="markdown-body"
      components={{
        span({ children, ...props }) {
          if (props.node?.properties.dataPrivacyComponent) {
            return (
              <ResponseTextItem sectionId={props.node?.properties.dataPrivacyComponent.toString()} />
            );
          }
          return <span {...props}>{children}</span>;
        },
        a({ children, ...props }) {
          const name = children as string;
          const element = refElements?.find((e) => e.name === name);

          if (element) {
            return <ElementRef element={element} />;
          } else {
            return (
              // @ts-ignore
              <Link {...props} target="_blank">
                {children}
              </Link>
            );
          }
        },
        code({ ...props }) {
          return <InlineCode {...props} />;
        },
        pre({ ...props }) {
          try {
            if (props.children && isValidElement(props.children)) {
              const { className, children: rawContent } = props.children?.props || {};
              if (className?.includes('-vega')) {
                const vegaSpec = JSON.parse(rawContent);
                return <VegaLite spec={vegaSpec} data={vegaSpec.data} />;
              } else if (className?.includes('-json')) {
                const jsonContent = JSON.parse(rawContent);
                if (jsonContent.$schema?.includes('vega.github.io')) {
                  return <VegaLite spec={jsonContent} data={jsonContent.data} />;
                }
              } else if (className?.includes('-mermaid')) {
                return <MermaidDiagram>{rawContent}</MermaidDiagram>;
              }
            }
          } catch (e) {
            return <Code {...props} />;
          }
          return <Code {...props} />;
        },
        table({ children, ...props }) {
          return (
            <TableContainer
              sx={{
                width: 'fit-content',
                minWidth: '300px'
              }}
              elevation={0}
              component={Paper}
            >
              {/* @ts-ignore */}
              <Table {...props}>{children}</Table>
            </TableContainer>
          );
        },
        thead({ children, ...props }) {
          // @ts-ignore
          return <TableHead {...props}>{children}</TableHead>;
        },
        tr({ children, ...props }) {
          // @ts-ignore
          return <TableRow {...props}>{children}</TableRow>;
        },
        th({ children, ...props }) {
          return (
            // @ts-ignore
            <TableCell {...props} align="right" sx={{ padding: 1 }}>
              {children}
            </TableCell>
          );
        },
        td({ children, ...props }) {
          return (
            // @ts-ignore
            <TableCell {...props} align="right" sx={{ padding: 1 }}>
              {children}
            </TableCell>
          );
        },
        tbody({ children, ...props }) {
          // @ts-ignore
          return <TableBody {...props}>{children}</TableBody>;
        },
        // @ts-expect-error custom plugin
        blinkingCursor: () => <BlinkingCursor whitespace />
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

export { Markdown };
