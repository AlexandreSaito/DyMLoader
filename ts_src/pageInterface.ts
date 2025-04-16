import { CustomHTMLObject } from './htmlInterface';

export interface PageLoadType {
    filePath?: string,
    html?: string | CustomHTMLObject;
}

export interface PageEventHandler {
    (param1: string, param2: number): boolean;
}

export interface IPage {

    modal: Function;
    addEventListener: Function;
    getData: Function;
    loadHtml: Function;
}