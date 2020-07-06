import Styles from "./App.less";

import { TreeGridComponent, ColumnsDirective, ColumnDirective } from '@syncfusion/ej2-react-treegrid';

import 'styles/bootstrap.css';
import ss from "../node_modules/slugify/slugify";

export const DEFAULT_API_VERSION = "48.0";
export const ROOT_PATH = "/services/data";

const log = console.log, error = console.error, debug = console.debug;
const slugify = (s) => {
    return ss(s, {
        remove: /[*+~\/\-.()'"!:@]/g,
        replace: ''
    })
}

class TreeItem {
    static counter() { if (!this.c) this.c = 1; return this.c++; };
    id;
    parentId;
    label;
    version;
    url;
    subtasks;
    loaded;
    isParent;
    constructor(t, v, u) {
        this.id = TreeItem.counter();
        this.parentId = undefined;
        this.label = t;
        this.version = v;
        this.url = u;
        this.isParent = true;
        this.loaded = false;
        this.subtasks = [];
    }
    //
    static find(element, field, value, accum) {
        var out = accum ? accum : [];
        if(element[field] === value) {
            out.push(element);
        }
        element.subtasks.forEach(childElement => 
            out = TreeItem.find(childElement, field, value, out) 
        );
        return out;
    }
    static flatten(element, accum) {
        var out = accum ? accum : [];
        out.push({
            id: element.id,
            parentId: element.parentId,
            isParent: element.isParent,
            label: element.label,
            version: element.version,
            loaded: element.loaded,
            url: element.url
        });
        element.subtasks.forEach(st => out = TreeItem.flatten(st, out))
        return out;
    }
}

export function getAuth() {
    return quip.apps.auth("oauth2");
}

export class SalesforceAPIService {
    //
    static getData(state) {
        const { currentTreeItem } = state;

        if (currentTreeItem && currentTreeItem.loaded) 
            return new Promise(()=>currentTreeItem);

        const getcache = () => {
                if (!this.__cache) this.__cache = {};
                return this.__cache; 
            }, setcacheitem = (e) => {
                this.__cache = Object.assign(this.__cache, e);
            },
            cache = getcache(),
            tokenResponse = getAuth().getTokenResponse(),
            url = `${tokenResponse.instance_url}${currentTreeItem.url}`,
            reqSlug = slugify(url),
            cacheItem = cache[reqSlug],
            urlLevel = currentTreeItem.url.split('/').reduce((t,n)=>t+(n.length>0?1:0),0);

        if(cacheItem && cacheItem.loaded) {
            log(`cache hit: ${reqSlug}`);
            return new Promise(()=>cacheItem);
        }

        log(`cache miss: ${reqSlug}, querying ${url}`);
        return getAuth().request({ url })
            .then(response => {
                if (!response.ok) return error("error", response);
                const parsedResp = response && response.kf ? JSON.parse(response.kf) : [];
                switch (urlLevel) {
                    case 2:
                        currentTreeItem.subtasks = parsedResp.map(e => {
                            const ti = new TreeItem(e.label, e.version, e.url);
                            ti.parentId = currentTreeItem.id;
                            return ti;
                        });
                        currentTreeItem.isParent = currentTreeItem.subtasks.length > 0;
                        currentTreeItem.loaded = true;
                        break;
                    case 3:
                    case 4:
                    case 5:    
                        const arr = [], keys = Object.keys(parsedResp);
                        keys.forEach(k => {
                            const vv = parsedResp[k], 
                                ti = new TreeItem(k, currentTreeItem.version, vv);
                            ti.parentId = currentTreeItem.id;
                            arr.push(ti);
                        })
                        currentTreeItem.subtasks = arr;
                        currentTreeItem.isParent = currentTreeItem.subtasks.length > 0;
                        currentTreeItem.loaded = true;
                        break;                 
                }
                const rs = {};
                rs[reqSlug] = currentTreeItem;
                setcacheitem(rs);

                return currentTreeItem;
            });
    }
}

const isUserLoggedIn = () => {
    return getAuth() ? 
        getAuth().isLoggedIn() :
        false;
}

export default class App extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            isLoggedIn: isUserLoggedIn(),
            loadingLogin: false,
        };
    }
    //
    login = () => {
        debug("login");
        this.setState({ loadingLogin: true });
        return getAuth()
            .login({ prompt: "login" })
            .then(this.updateIsLoggedIn)
            .finally(() => {
                this.setState({ loadingLogin: false });
            });
    };
    //
    logout = () => {
        this.setState({ loadingLogin: true });
        return getAuth()
            .logout()
            .then(this.updateIsLoggedIn)
            .finally(() => {
                this.setState({ loadingLogin: false });
            });
    };
    //
    updateIsLoggedIn = () => {
        this.setState({
            isLoggedIn: isUserLoggedIn()
        });
    };
    //
    render() {
        const { isLoggedIn } = this.state,
            n = !isLoggedIn ? this.login : this.logout,
            text = !isLoggedIn ? "Log in" : "Log out";
        return <div>
            {isLoggedIn && <SalesforceNavigator />}
        </div>;
    }
}

class SalesforceNavigator extends React.Component {
    state;
    treeGridInstance;
    static dataService = new SalesforceAPIService();
    constructor() {
        super(...arguments);
        this.state = {
            rootTreeItem: new TreeItem(`Salesforce`, 'All', ROOT_PATH)
        };
        this.state.currentTreeItem = this.state.rootTreeItem;
    }
    //
    getData() {
        const isInited = this.treeGridInstance 
            && this.treeGridInstance.dataSource instanceof Array;
        if (isInited && !this.state.currentTreeItem.loaded) {
            this.state.requestType = 'init';
            this.dataStateChange(this.state);
        }
    }
    //
    dataStateChange(state) { 
        const rq = state.requestType ? state.requestType : 'NULL';
        log(`${rq} dataStateChange()`);
        if(state.requestType === 'expand') {
            state.currentTreeItem = TreeItem.find(this.state.rootTreeItem, 'id', state.data.id)[0];
            if (state.currentTreeItem.loaded) return;
        }
        if(state.requestType === 'select') {
            state.currentTreeItem = TreeItem.find(this.state.rootTreeItem, 'id', state.data.id)[0];
            if (state.currentTreeItem.loaded) return;
        }
        SalesforceAPIService.getData(state).then((currentTreeItem) => {
            if (state.requestType === 'expand') {
                state.childData = currentTreeItem.subtasks;
                state.childDataBind();
                currentTreeItem.isParent = currentTreeItem.subtasks.length > 0;
                currentTreeItem.loaded = true;
                this.setState({currentTreeItem});
            } else if (state.requestType === 'select') {
                this.setState({currentTreeItem});
            } else if (state.requestType === 'init') {
                currentTreeItem.isParent = currentTreeItem.subtasks.length > 0;
                currentTreeItem.loaded = true;
                this.setState({rootTreeItem:currentTreeItem, currentTreeItem});
            }
        });
    }
    //
    get items() {
        const rti = this.state.rootTreeItem,
            srcItems = rti ? TreeItem.flatten(rti) : [],
            outItems = srcItems.map(e => { 
                    return {
                    label: e.label,
                    version: e.version,
                    url: e.url,
                    isParent: e.subtasks ? e.subtasks.length > 0 : !e.loaded,
                    loaded: e.loaded,
                    parentId: e.parentId,
                    id: e.id
                }
            });
        return outItems;
    }
    rowSelected(evt) {
        if(!evt.data.loaded) {
            const state = { requestType: 'select', data: { id: evt.data.id } };
            setTimeout(()=>this.dataStateChange(state),0); 
        }     
    }
    //
    render() {
        return <div style={{ width:'960px', marginTop: '20px' }}>
            <TreeGridComponent
                id="TreeGrid"
                idMapping='id'
                parentIdMapping='parentId'
                childMapping='subtasks'
                hasChildMapping='isParent'
                height='410'
                dataSource={this.items}
                dataBound={this.getData.bind(this)}
                ref={treegrid => this.treeGridInstance = treegrid}
                dataStateChange={this.dataStateChange.bind(this)}
                allowPaging={false}
                treeColumnIndex={1}
                rowSelected={this.rowSelected}>
                <ColumnsDirective>
                    <ColumnDirective
                        field='id'
                        headerText='Element ID'
                        width='100'
                        isPrimaryKey={true}
                        textAlign='Right'/>
                    <ColumnDirective
                        field='label'
                        headerText='Label'
                        width='200'/>
                    <ColumnDirective
                        field='version'
                        headerText='Version'
                        width='100'/>
                    <ColumnDirective
                        field='url'
                        headerText='URL'
                        width='200'/>
                </ColumnsDirective>
            </TreeGridComponent>
        </div>;
    }
}
