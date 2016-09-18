
import React, { Component, PropTypes, createElement } from 'react'
import { Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table'
import { TextField, Paper, DropDownMenu, MenuItem, LinearProgress, FlatButton } from 'material-ui'

import Translator from 'counterpart'
import Utils from '../common/Utils.js'

const isMounted = (component) => {
  // exceptions for flow control :(
  try {
    React.findDOMNode(component);
    return true;
  } catch (e) {
    // Error: Invariant Violation: Component (with keys: props,context,state,refs,_reactInternalInstance) contains `render` method but is not mounted in the DOM
    return false;
  }
};
class M2Table extends Component {
  constructor(props){
    super(props)

    let { moduleName, pageDefault, showColumns, tableSetting, tableCustomSetting, primaryType } = this.props;
    this.state = {
      moduleName: moduleName,
      primaryType,
      tableData: {
        page: 1,
        lastPage: 1
      },
      tableShowData: [],
      pageDefault: Object.assign({
        page: 1,
        size: 15,
        sort: 'created_at,desc'
      }, pageDefault),
      showColumns: showColumns || [],
      tableSetting: Object.assign({
        height: '720px',
        fixedHeader: true,
        fixedFooter: true,
        selectable: true,
        multiSelectable: true,
        showRowHover: true,
        stripedRows: false,

        // unuse
        showCheckboxes: false, // displaySelectAll, adjustForCheckbox
        enableSelectAll: true,
        deselectOnClickaway: false
      }, tableSetting),
      tableCustomSetting: Object.assign({
        showFooter: false,
        footerStyle: {},
        columnTitleStyle: {
          verticalAlign: 'middle',
          padding: '0 5px'
        },
        headerStyle: {
          overflowX: 'auto',
        },
        bodyStyle: {
          overflowX: 'auto',
        },
        bodyClassName: 'mui-table-body',
        tableBodyStyle: {
          overflowX: 'auto',
        },
        rowColumnStyle: {
          padding: '0 5px'
        }
      }, tableCustomSetting),
      dataLoading: false
    }
  }

  loadData(newPageDefault) {
    let { dataLoading } = this.state;
    if(dataLoading){
      return ;
    }

    const { store } = this.context;
    let lang = store.getState().basePageReducer.PageLang;
    let { primaryType, moduleName, pageDefault } = this.state;
    let dataPageState = Object.assign({}, pageDefault, newPageDefault);

    this.setState({dataLoading: true}, function(){
      let url = '/dash/' + moduleName;
      let args = {
        locale: lang
      };

      switch( primaryType ){
        case 'lang':
          url = '/dash/'+ 'sys_assets';
          args = {
            table: moduleName
          }
          break;
        case 'dropdown':
          url = '/dash/'+ 'sys_xialacanshu';
          args = {
            table: moduleName
          }
          break;
        default:
      }

      Utils.ajax( url )
        .get( Object.assign({}, args, dataPageState) )
        .then( function(res){
          let { data, status } = res;
          // console.info(data)
          if(data.data.length > 0){
            this.setState({
              tableData: {
                page: data.current_page,
                lastPage: data.last_page
              },
              tableShowData: data.data,
              dataLoading: false
            })
          }else{
            this.setState({dataLoading: false})
          }
        }.bind(this) )
        //*
        .catch( function(err){
          let { statusText, status } = err;
          console.warn(statusText, status)
          this.setState({dataLoading: false})
        }.bind(this) )// */
    }.bind(this))
  }

  componentDidMount(){
    this.loadData()
    if (isMounted(this)) {
    }
  }

  renderPagination() {
    let { tableData, pageDefault } = this.state;
    let handleChange = (event, index, value) => {
      if( pageDefault.page === value ){
        return ;
      }
      let newPageDefault = Object.assign({}, pageDefault, { page: value })
      this.setState({
        pageDefault: newPageDefault
      }, this.loadData(newPageDefault) )
    }
    let pagingElements = [];
    let { page, lastPage } = tableData;
    console.log(pageDefault, page)
    if(lastPage > 1){
      for(let i = 2; i < (lastPage ? lastPage + 1 : 1); i++){
        pagingElements.push(
          <MenuItem key={'paging-element-' + i}
            value={i} label={(i) +' '+ Translator('sys_dash.tableTextPage')} primaryText={i}
          />
        )
      }
    }
    pagingElements.unshift(
      <MenuItem key={'paging-element-' + 1}
        value={1} label={(1) +' '+ Translator('sys_dash.tableTextPage')} primaryText={1}
      />
    )
    // console.log(pagingElements)

    return (
      <div style={{textAlign: 'center'}}>
        <DropDownMenu className={'mui-table-pagination'}
          value={pageDefault.page} onChange={handleChange}
          >
          { pagingElements }
        </DropDownMenu>
      </div>
    )
  }

  renderColumnsTitles() {
    let { columnTitleStyle } = this.state.tableCustomSetting;
    let { tableShowData, moduleName, showColumns, primaryType } = this.state;
    let noneShowCol = showColumns.length === 0;
    let showColumnsName = [];
    let showColumnsNameText = {};
    showColumns.map( (i, id) => {
      showColumnsName.push(i.name);
      showColumnsNameText[i.name] = i.text;
    })
    let firstItem = tableShowData.length > 0 ? tableShowData[0] : {};
    let firstItemRightSort = Object.assign({}, showColumnsNameText, firstItem )
    let mergeItemForHeader = Object.assign({}, firstItemRightSort, showColumnsNameText );

    let columnsTitles = [];
    for ( let _key in mergeItemForHeader){
      // console.log(_key, mergeItemForHeader[_key])
      // if none custom show columns => show all ||  if not , show custom column
      if( noneShowCol || showColumnsName.indexOf(_key) > -1 ){
        let headerText = _key === '_links' ? '_links' : mergeItemForHeader[_key]
        columnsTitles.push(
          <TableRowColumn key={'header-element$'+headerText}
            style={columnTitleStyle}
            tooltip={headerText}>
            { Translator( ( primaryType ? 'sys_dash' : moduleName ) +'.'+ headerText) }
          </TableRowColumn>
        )
      }
    }
    columnsTitles.unshift(
      <TableRowColumn key={'header-custom-' + 0}
        style={ Object.assign({}, columnTitleStyle, {width: '45px'}) }
        >
        {'#'}
      </TableRowColumn>
    )
    return columnsTitles
  }
  renderTableHeader() {
    let { showCheckboxes, enableSelectAll } = this.state.tableSetting;
    let { headerStyle } = this.state.tableCustomSetting;
    let { showColumns } = this.state;
    if (false && showColumns.length === 0){
      headerStyle = Object.assign({}, headerStyle, {display: 'none'});
    }

    return (
      <TableHeader
        displaySelectAll={showCheckboxes}
        adjustForCheckbox={showCheckboxes}
        enableSelectAll={enableSelectAll}
        style={headerStyle}
        >
        <TableRow className={'hide'}>
          <TableHeaderColumn colSpan="3" tooltip="The Group Header" style={{textAlign: 'center'}}>
            Group Header
          </TableHeaderColumn>
        </TableRow>
        <TableRow>
          { this.renderColumnsTitles() }
        </TableRow>
      </TableHeader>
    )
  }

  renderRowElements(row, rowIndex) {
    let rowList = Object.assign({}, row)
    let { showColumns, primaryType } = this.state;
    let { rowColumnStyle } = this.state.tableCustomSetting;
    let noneShowCol = showColumns.length === 0;
    let showColumnsName = [];
    let showColumnsNameComponent = {};
    showColumns.map( (i, id) => {
      showColumnsName.push(i.name);
      showColumnsNameComponent[i.name] = i.components || undefined;
    })

    let rowElements = [];
    for (let _key in rowList){
      let columnClassName = noneShowCol ? '' :
        // if has custom showColumns , hide other columns
        showColumnsName.indexOf( _key ) > -1 ? '' : 'hide';

      // console.log(_key, rowList[_key], columnClassName)
      let rowColumnElement = null;
      let containerColumnStyle = {};

      let itemComponent = showColumnsNameComponent[_key];
      // if has custom showColumns and The custom column has component
      if( !noneShowCol && Utils.isExist( itemComponent ) ){
        let customComponentProps = Object.assign({}, {
          rowData: rowList,
          pageProps: this.props,
          primaryType,
          rowIndex
        })

        if( itemComponent instanceof Array){
          rowColumnElement = [];
          itemComponent.forEach( (item, index) => {
            rowColumnElement.push(
              <span key={'custom-component-' + index} className='m2-table-component-cell multiple'>
                { createElement(item, customComponentProps) }
              </span>
            )
          })
        }else{
          //*/ just render it
          rowColumnElement = (
            <span className='m2-table-component-cell'>
              { createElement(itemComponent, customComponentProps) }
            </span>
          )
        }
        containerColumnStyle = {overflow: 'initial'}
        columnClassName += ' m2-custom-column'
      }else{
        let _el = null;
        switch(_key){
          case '_links':
            _el = rowList[_key].self.href;    break
          case 'creationTime':
          case 'modifiedTime':
            _el = Translator.localize(new Date(rowList[_key]));    break
          default:
            _el = rowList[_key]
        }
        rowColumnElement = (
          <span className="m2-table-cell ellipsis">
            {_el}
          </span>
        )
      }

      rowElements.push(<TableRowColumn key={'row-element$'+ _key}
        style={ Object.assign({}, rowColumnStyle, containerColumnStyle) }
        className={ columnClassName }>
        { rowColumnElement }
      </TableRowColumn>)
    }
    // console.info('row Elements:', rowElements)
    return rowElements
  }
  renderTableBody() {
    let { tableShowData, moduleName, showColumns, dataLoading } = this.state;
    let showColumnsNameText = {};
    showColumns.map( (i, id) => {
      showColumnsNameText[i.name] = i.text;
    })

    let { deselectOnClickaway, showRowHover, stripedRows, showCheckboxes } = this.state.tableSetting;
    let { columnTitleStyle, tableBodyStyle, rowStyle } = this.state.tableCustomSetting;
    return (
      <TableBody
        displayRowCheckbox={showCheckboxes}
        deselectOnClickaway={deselectOnClickaway}
        showRowHover={showRowHover}
        stripedRows={stripedRows}
        bodyStyle={tableBodyStyle}
        >
        {
          tableShowData.length === 0 ?
            (
              <TableRow><TableRowColumn style={{textAlign: 'center'}}>
                {dataLoading ? Translator('sys_dash.jiaZaiZhong') : Translator('sys_dash.wuShuJu')}
              </TableRowColumn></TableRow>
            ) :
            tableShowData.map( (item, index) => {
              let mergeItem = Object.assign({}, showColumnsNameText, item)
              // console.log('mergeItem: ', mergeItem)

              return (
                <TableRow key={'row'+index}
                  style={rowStyle} selected={item.selected}>
                  <TableRowColumn
        						style={ Object.assign({}, columnTitleStyle, {width: '45px'}) }
                    >
                    {index + 1}
                  </TableRowColumn>

                  { this.renderRowElements(mergeItem, index) }

                </TableRow>
              )
            })
        }
      </TableBody>
    )
  }

  renderTableFooter() {
    let { showCheckboxes, enableSelectAll } = this.state.tableSetting;
    let { footerStyle, showFooter } = this.state.tableCustomSetting;
    return (
      <TableFooter
        style={footerStyle}
        adjustForCheckbox={showFooter}
        className={ showCheckboxes === true ? '' : 'm2-table-footer-non-checkboxes' }
        >
        <TableRow>
          { this.renderColumnsTitles() }
        </TableRow>
      </TableFooter>
    )
  }

  render () {
    let { tableData, moduleName, dataLoading, showColumns } = this.state;
    let { height, fixedHeader, fixedFooter, selectable, multiSelectable } = this.state.tableSetting;
    let { footerStyle, bodyStyle, bodyClassName } = this.state.tableCustomSetting;
    // console.info('m2-table this : ', this)

    return (
      <Paper zDepth={1}>
        <LinearProgress style={{display: dataLoading ? 'block':'none'}} imode="indeterminate" />

        <div className="mui-table-box">
          <Table
            height={height}
            fixedHeader={fixedHeader}
            fixedFooter={fixedFooter}
            selectable={selectable}
            multiSelectable={multiSelectable}
            bodyStyle={bodyStyle}
            className={showColumns.length === 0 ? bodyClassName : ''}
            >

            { this.renderTableHeader() }
            { this.renderTableBody() }
            { this.renderTableFooter() }
          </Table>
        </div>

        { this.renderPagination() }
      </Paper>
    )
  }
}
M2Table.contextTypes = {
  store: PropTypes.object
}

M2Table.propTypes = {
  moduleName: PropTypes.string.isRequired,
  showColumns: PropTypes.array,
  pageDefault: PropTypes.object,
  tableSetting: PropTypes.object,
  tableCustomSetting: PropTypes.object,
}

// don't change this to ES6 style
module.exports = M2Table
