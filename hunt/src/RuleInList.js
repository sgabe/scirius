/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Badge, ListGroup, ListGroupItem } from 'react-bootstrap';
import { Col, Icon, Row, Spinner, ListViewIcon, ListViewInfoItem, ListViewItem } from 'patternfly-react';
import { sections } from 'hunt_common/constants';
import RuleEditKebab from './components/RuleEditKebab';
import SciriusChart from './components/SciriusChart';
import EventValue from './components/EventValue';
import { addFilter } from './containers/App/stores/global';

const RuleInList = (props) => {
    const { category } = props.data;
    const source = props.sources[category.source];
    let catTooltip = category.name;
    if (source && source.name) {
        catTooltip = `${source.name}: ${category.name}`;
    }
    const kebabConfig = { rule: props.data };
    return (
        <ListViewItem
            key={props.data.sid}
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/interactive-supports-focus
            actions={[<a role="button" key={`actions-${props.data.sid}`} onClick={() => props.addFilter(sections.GLOBAL, { id: 'alert.signature_id', value: props.data.sid, negated: false })}><Icon type="fa" name="search-plus" /> </a>, <RuleEditKebab key={`kebab-${props.data.sid}`} config={kebabConfig} rulesets={props.rulesets} />]}
            leftContent={<ListViewIcon name="security" className="pficon pficon-security" />}
            additionalInfo={[<ListViewInfoItem key={`created-${props.data.sid}`}><p>Created: {props.data.created}</p></ListViewInfoItem>,
                <ListViewInfoItem key={`updated-${props.data.sid}`}><p>Updated: {props.data.updated}</p></ListViewInfoItem>,
                <ListViewInfoItem key={`category-${props.data.sid}`}><p data-toggle="tooltip" title={catTooltip}>Category: {category.name}</p></ListViewInfoItem>,
                <ListViewInfoItem key={`hits-${props.data.sid}`}><Spinner loading={props.data.hits === undefined} size="xs"><p>Alerts <span className="badge">{props.data.hits}</span></p></Spinner></ListViewInfoItem>
            ]}
            heading={props.data.sid}
            description={props.data.msg}
        >
            {props.data.timeline && <Row>
                <Col sm={11}>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="SigContent" dangerouslySetInnerHTML={{ __html: props.data.content }}></div>
                        </div>
                        <div className="row">
                            <div className="col-md-12">
                                <SciriusChart
                                    data={props.data.timeline}
                                    axis={{ x: { min: props.filterParams.fromDate, max: props.filterParams.toDate } }}
                                    legend={{ show: false }}
                                    padding={{ bottom: 10 }}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-4">
                                <h4>Probes</h4>
                                <ListGroup>
                                    {props.data.probes.map((item) => (
                                        <ListGroupItem key={item.probe}>
                                            <EventValue field={'host'} value={item.probe} right_info={<Badge>{item.hits}</Badge>} />
                                        </ListGroupItem>))}
                                </ListGroup>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>}
        </ListViewItem>
    );
}

RuleInList.propTypes = {
    data: PropTypes.any,
    sources: PropTypes.any,
    rulesets: PropTypes.any,
    filterParams: PropTypes.object.isRequired,
    addFilter: PropTypes.any,
};

const mapDispatchToProps = {
    addFilter
};

export default connect(null, mapDispatchToProps)(RuleInList);
