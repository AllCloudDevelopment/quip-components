import quip from "quip";
import App from "./App.jsx";

class BookmarkRootRecord extends quip.apps.RootRecord {
    static getProperties = () => ({
        title: "string",
        bookmark: "string",
        description: quip.apps.RichTextRecord,
        tags: "string"
    })
    static getDefaultProperties = () => ({
        title: "Enter a title for this bookmark",
        bookmark: "Enter the URL of the bookmark",
        description: { RichText_placeholderText: "Type a bookmark description in here" },
        title: "enter,comma,separated,tags",
    })
}
quip.apps.registerClass(BookmarkRootRecord, "bookmark-root-record");

quip.apps.initialize({
    initializationCallback: (root, params) => {
        ReactDOM.render(<App record={quip.apps.getRootRecord()} />, root);
    },
});
