import Styles from "./App.less";
//import 'react-sortable-tree/style.css'; // This only needs to be imported once in your app
import SortableTree from 'react-sortable-tree';

export const DEFAULT_API_VERSION = "48.0";
export const ROOT_PATH = "/services/data/";

const log = console.log, error = console.error;

const sampleTree = [{
    'title': 'subby',
    'children': [
        {
            'title': '1211',
            'children': [
                {
                    'title': '2122',
                    'children': []
                },
                {
                    'title': '4133',
                    'children': []
                }
            ]
        },
        {
            'title': '1112',
            'children': []
        },
        {
            'title': '1113',
            'children': []
        }
    ]
}];
export function getAuth() {
    return quip.apps.auth("oauth2");
}

export default class App extends React.Component {
    constructor(props) {
        super();
        this.state = {
            isLoggedIn: getAuth().isLoggedIn(),
            loadingLogin: false,
        };
    }

    login = () => {
        console.debug("login");
        this.setState({loadingLogin: true});
        return getAuth()
            .login({prompt: "login"})
            .then(this.updateIsLoggedIn)
            .finally(() => {
                this.setState({loadingLogin: false});
            });
    };

    logout = () => {
        this.setState({loadingLogin: true});
        return getAuth()
            .logout()
            .then(this.updateIsLoggedIn)
            .finally(() => {
                this.setState({loadingLogin: false});
            });
    };

    updateIsLoggedIn = () => {
        this.setState({
            isLoggedIn: getAuth().isLoggedIn(),
        });
    };

    render() {
        const {isLoggedIn} = this.state;
        const fn = !isLoggedIn ? this.login : this.logout;
        const text = !isLoggedIn ? "Log in" : "Log out";
        return <div>
            {isLoggedIn &&  <SalesforceNavigator/>}
        </div>;
    }
}

class SalesforceNavigator extends React.Component {
    constructor(props) {
        super();
        this.state = {
            initialLoad: false,
            rootTreeItem: {
                title :  `Salesforce`,
                subTitle : ROOT_PATH,
                url : ROOT_PATH,
                children : []
            },
            endpoint: ROOT_PATH,
            treeData: [],
            curTreeItem: {}
        };
        this.state.curTreeItem = this.state.rootTreeItem;
        this.state.treeData.push(this.state.rootTreeItem);
        log('query for path: ', this.state.endpoint);
        this.queryEndpoint(ROOT_PATH);
    }
    queryEndpoint = s => {
        const {endpoint, treeData, curTreeItem, rootTreeItem} = this.state;
        const tokenResponse = getAuth().getTokenResponse();
        const url = `${tokenResponse.instance_url}${endpoint}`;
        getAuth()
            .request({url})
            .then(response => {
                if (!response.ok) return error("error", response);
                const ro = response && response.kf ? JSON.parse(response.kf) : [];
                curTreeItem.children = ro.map(el => {
                    log(el);
                    return {
                        title : `${el.label} (Version ${el.version})`,
                        subTitle : el.url,
                        url : el.url
                    };
                });
                this.setState({
                    endpoint: url,
                    treeData: curTreeItem.children,
                });
                this.setState({
                    endpoint: url,
                    treeData : JSON.parse(ro).map(el => {
                        const o = {
                            title : `${el.label} (Version ${el.version})`,
                            subTitle : el.url,
                            url : el.url
                        };
                        log(o);
                        return o;
                    })
                });
                this.state.curTreeItem.children = this.state.treeData;
            });
    };

    elementClicked(e) {
        log(e);
    }
    
    render() {
        const {initialLoad} = this.state;
        if(!initialLoad) {
            this.setState({initialLoad: true});
            this.queryEndpoint(this.state.endpoint);
        }
        const items = []
        for (const value of this.state.treeData.children) {
          items.push(<li><a onclick={elementClicked}>{value.title}</a></li>);
        }
        return (<div className={Styles.boundingContainer}><ul>{items}</ul></div>);
    }
}
