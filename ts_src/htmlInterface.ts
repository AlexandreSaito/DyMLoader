export interface CustomHTMLObject {

}

export interface CustomModalObject {
    title: string | CustomHTMLObject;
    body: string | CustomHTMLObject;
    footer: string | CustomHTMLObject;
    on?: null | CustomModalHandler;
}

export interface CustomModalHandler {
    (...args: any): void;
}
