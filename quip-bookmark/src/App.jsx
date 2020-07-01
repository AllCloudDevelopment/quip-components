import Styles from "./App.less";
import { ReactTinyLink } from 'react-tiny-link'

export default class App extends React.Component {
    setTitle = () => {
        const { record } = this.props;
        record.set("title", "new title");
    }
    setBookmark = () => {
        const { record } = this.props;
        record.set("bookmark", "http://google.com");
    }
    setTags = () => {
        const { record } = this.props;
        record.set("tags", "fake,news");
    }
    render() {
        const { record } = this.props;
        const bookmark = record.get("bookmark");
        const linkComponent = !bookmark ? < d/> :  <
            ReactTinyLink
            cardSize="small"
            showGraphic={true}
            maxLine={2}
            minLine={1}
            url={bookmark}
        />;
        return (
            <div>
                <button onClick={this.setTitle}>Set title</button>
                <button onClick={this.setBookmark}>Set bookmark</button>
                <button onClick={this.setTags}>Set tags</button>
                <br />
                {record.get("title") || "No title set"}
                <br />
                {record.get("bookmark") || "No bookmark set"}
                <br />
                {record.get("tags") || "No tags set"}
                <br />
                <quip.apps.ui.RichTextBox record={record.get("description")} />
                {linkComponent}
            </div>
        );
    }
}
