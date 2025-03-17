import { DecoratorNode, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import {ReactNode} from 'react';

export interface ImportStatement {
    source: string;
    defaultExport: boolean;
}

interface MetaData {
    importDeclarations: Record<string, ImportStatement>
}

export type SerializedMetaDataNode = Spread<
    {type: 'metaData'} & MetaData,
    SerializedLexicalNode
>;


/**
 * A lexical node that represents meta data. This node has no visual representation
 * and is used to keep information from the mdast-import that is needed when
 * exporting the lexical state to markdown.
 * @example
 *  The source may contain import statements, which should not be modified unless
 *  the component isn't used anymore. A {@link GenericJsxEditor} can be used
 *  to catch all unknown JSX Elements, but for the export the information from
 *  where these components were imported, is missing. Therefore, the {@link MdastImportVisitor}
 *  gathers all import statements on the root level and stores them in a MetaDataNode.
 */
export class MetaDataNode extends DecoratorNode<ReactNode> {
    __importDeclarations: Record<string, ImportStatement>;
  
    static getType(): string {
      return 'metaData';
    }
  
    static clone(node: MetaDataNode): MetaDataNode {
      return new MetaDataNode(node.getMetaData(), node.__key);
    }
  
    constructor(metaData?: MetaData, key?: NodeKey) {
      super(key);
      this.__importDeclarations = {...(metaData?.importDeclarations || {})};
    }
  
    createDOM(): HTMLElement {
      return document.createElement('div');
    }
  
    updateDOM(): false {
      return false;
    }
  
    decorate(): ReactNode {
      return null;
    }
    
    getMetaData(): MetaData {
        return {
            importDeclarations: {...this.__importDeclarations}
        }
    }

    setImportDeclarations(declarations: Record<string, ImportStatement>) {
        this.getWritable().__importDeclarations = declarations;
    }

    
    /** @internal */
    exportJSON(): SerializedMetaDataNode {
        return {
            type: 'metaData',
            version: 1,
            ...this.getMetaData(),
        };
    }

    
    /** @internal */
    static importJSON(serializedNode: SerializedMetaDataNode): MetaDataNode {
        const { importDeclarations } = serializedNode;
        const node = $createMetaDataNode({
            importDeclarations
        });
        return node;
    }
  }
  
  export function $createMetaDataNode(metaData: MetaData): MetaDataNode {
    return new MetaDataNode(metaData);
  }
  
  export function $isMetaDataNode(
    node: LexicalNode | null | undefined,
  ): node is MetaDataNode {
    return node instanceof MetaDataNode;
  }