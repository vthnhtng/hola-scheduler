export interface DataProvider {
    getSelections(): { value: string; label: string }[];
}
