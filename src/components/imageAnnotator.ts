export interface ImageAnnotatorManager {
    export(): Uint8Array;

    load(file: File): any;
}