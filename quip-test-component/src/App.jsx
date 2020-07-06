import Styles from "./App.less";
import 'react-sortable-tree/style.css'; // This only needs to be imported once in your app
import SortableTree from 'react-sortable-tree';

const sampleTree = [{
    'title': 'root',
    'children': [
        {
            'title': '1111',
            'children': [
                {
                    'title': '1122',
                    'children': [{
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
                    }]
                },
                {
                    'title': '1133',
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

export default class App extends React.Component {
    render() {
        return (<div className={Styles.hostcontainer}>
            <SortableTree className={Styles.treesize} treeData={sampleTree.children} />
        </div>)
    }
}
