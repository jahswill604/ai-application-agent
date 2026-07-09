declare module 'pdf-parse' {
  interface PDFParseOptions {
    pagerender?: (pageData: any) => string;
    max?: number;
    version?: string;
  }

  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  function pdf(dataBuffer: Buffer, options?: PDFParseOptions): Promise<PDFParseResult>;
  export = pdf;
}

declare module 'mammoth' {
  interface MammothResult {
    value: string;
    messages: any[];
  }

  interface ExtractOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
  }

  export function extractRawText(options: ExtractOptions): Promise<MammothResult>;
  export function convertToHtml(options: ExtractOptions): Promise<MammothResult>;
}
