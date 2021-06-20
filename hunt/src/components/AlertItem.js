import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { ListViewItem, ListViewInfoItem, ListViewIcon, Row, Col, Spinner } from 'patternfly-react';
import * as config from 'hunt_common/config/Api';
import { dashboard } from 'hunt_common/config/Dashboard';
import { buildFilterParams } from 'hunt_common/buildFilterParams';
import axios from 'axios';
import ReactJson from 'react-json-view';
import { Tabs, Tab } from 'react-bootstrap';
import EventField from './EventField';
import ErrorHandler from './Error';

export default class AlertItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            events: undefined,
            showTabs: false,
            collapsed: {}
        };

        this.addFilter = this.addFilter.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.toggleCollapse = this.toggleCollapse.bind(this);
    }

    getTitle = (ev) => {
        let msg = '';

    if (ev.event_type === 'alert') {
      msg = ev.alert.signature;
    } else if (ev.event_type === 'dns') {
      if (ev.dns.type === 'answer') {
        if (ev.dns.grouped) {
          Object.keys(ev.dns.grouped).forEach((key, idx) => {
            if (idx > 0) {
              msg += ` / ${key} ${ev.dns.type} ${ev.dns.rrname} - ${ev.dns.grouped[key].join(', ')}`;
            } else {
              msg = `${key} ${ev.dns.type} ${ev.dns.rrname} - ${ev.dns.grouped[key].join(', ')}`;
            }
          });
        } else if ('answers' in ev.dns) {
          msg += ' - ';
          msg += ev.dns.answers
            .map((dns) => dns[dns.rrtype])
            .filter((a) => a || false)
            .join(', ');
        }
      } else {
        msg = `${ev.dns.rrtype} ${ev.dns.type} ${ev.dns.rrname}`;
      }
    } else if (ev.event_type === 'fileinfo') {
      msg = ev.fileinfo.filename;

            if (ev.fileinfo.magic) {
                msg += ` ${ev.fileinfo.magic}`;
            }
        } else if (ev.event_type === 'http') {
            if (ev.http.http_method) {
                msg = ev.http.http_method;
            }

            msg += ' http://';
            if (ev.http.hostname) {
                msg += ev.http.hostname;
            } else {
                msg += ev.dest_ip;
            }

            if (ev.http.url) {
                msg += ev.http.url;
            }

            if (ev.http.status) {
                msg += ` - ${ev.http.status}`;
            }
        } else if (ev.event_type === 'tls') {
            if (ev.tls.sni) {
                msg += ev.tls.sni;
                if (ev.tls.subject) {
                    msg += ' - ';
                }
            }
            if (ev.tls.subject) {
                msg += ev.tls.subject;
            }
        } else if (ev.event_type === 'flow') {
            msg += `${ev.flow.start} / ${ev.flow.end}`;
        }

        if (!msg) {
            let info = ev;
            if (ev[ev.event_type]) {
                info = ev[ev.event_type];
            }
            msg = JSON.stringify(info);
        }

        if (msg.length > 200) {
            msg = `${msg.substr(0, 200)}…`; /* ignore_utf8_check: 8230 */
        }

        msg = `${ev.event_type.charAt(0).toUpperCase()}${ev.event_type.substr(1).toLowerCase()}: ${msg}`;
        return msg;
    }

    nbEvents = (events) => {
        let nb = 0;
        if (events) {
            Object.keys(events).forEach((key) => {
                nb += Object.keys(events[key]).length;
            });

            return `(${nb})`;
        }
        return '';
    }

    formatString = (str, ...params) => {
        for (let i = 0; i < params.length; i += 1) {
            const reg = new RegExp(`\\{${i}\\}`, 'gm');
            str = str.replace(reg, params[i]);
        }
        return str;
    }

    toggleCollapse(key) {
        const { collapsed } = this.state;

        if (key in collapsed) {
            collapsed[key] = !collapsed[key];
        } else {
            collapsed[key] = false;
        }

        this.setState({ collapsed });
    }

    addFilter(id, value, negated) {
        this.props.addFilter({ id, value, negated });
    }

    fetchData(flowId) {
        if (!this.state.showTabs) {
            const filterParams = buildFilterParams(this.props.filterParams);
            const url = `${config.API_URL + config.ES_BASE_PATH}events_from_flow_id/?qfilter=flow_id:${flowId}&${filterParams}`;
            axios.get(url).then((res) => {
                if ((res.data !== null)) {
                    if ('Alert' in res.data) {
                        for (let idx = 0; idx < Object.keys(res.data.Alert).length; idx += 1) {
                            const item = res.data.Alert[idx];

                            if (JSON.stringify(item) === JSON.stringify(this.props.data)) {
                                res.data.Alert.splice(idx, 1);

                                if (res.data.Alert.length === 0) {
                                    delete res.data.Alert;
                                }
                                break;
                            }
                        }
                    }
                    this.setState({ events: res.data });
                }
            });
        }
        this.setState({ showTabs: !this.state.showTabs });
    }

    render() {
        const data = { ...this.props.data };
        const { events, showTabs } = this.state;
        const ipParams = (<div> {data.src_ip} <span className="glyphicon glyphicon-arrow-right"></span> {data.dest_ip}</div>);
        let sourceNetwork;
        let targetNetwork;
        if (data.alert.source) {
            if (data.alert.source.net_info_agg) {
                sourceNetwork = (<ErrorHandler><EventField field_name="Source Network" field="alert.source.net_info_agg" value={data.alert.source.net_info_agg} addFilter={this.addFilter} /></ErrorHandler>);
            } else if (data.alert.source.net_info) {
                sourceNetwork = (
                    <React.Fragment>
                        <dt>Source Network</dt>
                        <dd>{data.alert.source.net_info.join(', ')}</dd>
                    </React.Fragment>
                );
            }
        }
        if (data.alert.target) {
            if (data.alert.target.net_info_agg) {
                targetNetwork = (
                    <ErrorHandler>
                        <EventField
                            field_name="Target Network"
                            field="alert.target.net_info_agg"
                            value={data.alert.target.net_info_agg}
                            addFilter={this.addFilter}
                        />
                    </ErrorHandler>
                );
            } else if (data.alert.target.net_info) {
                targetNetwork = (
                    <React.Fragment>
                        <dt>Source Network</dt>
                        <dd>{data.alert.target.net_info.join(', ')}</dd>
                    </React.Fragment>
                );
            }
        }

        const hasTarget = data.alert.target !== undefined;
        const hasLateral = data.alert.lateral !== undefined;

        const addInfo = [
            <ListViewInfoItem key="timestamp"><p>{moment(data.timestamp).format('YYYY-MM-DD, hh:mm:ss a')}</p>
            </ListViewInfoItem>,
            <ListViewInfoItem key="app_proto"><p>Proto: {data.app_proto}</p></ListViewInfoItem>,
            <ListViewInfoItem key="host"><p>Probe: {data.host}</p></ListViewInfoItem>,
            <ListViewInfoItem key="category"><p>Category: {data.alert.category}</p></ListViewInfoItem>,
        ];
        let iconclass = 'primary';
        if (data.alert.tag) {
            addInfo.push(<ListViewInfoItem key="tag"><p>Tag: {data.alert.tag}</p></ListViewInfoItem>);
            iconclass = data.alert.tag;
        }

        let dnsQuery;
        if (data.dns && data.dns.query) {
            [dnsQuery] = data.dns.query;
        }
        heading={ipParams}
        additionalInfo={addInfo}
        onExpand={() => this.fetchData(data.flow_id)}
        onExpandClose={() => this.setState({ showTabs: false })}
      >
        <Tabs id="alert-tabs">
          <Tab eventKey="alert" title="Synthetic view">
            <Row>
              <Col sm={4}>
                <div className="card-pf">
                  <div className="card-pf-heading">
                    <h5 className="card-title">Signature</h5>
                  </div>
                  <div className="card-pf-body">
                    <dl className="dl-horizontal">
                      <ErrorHandler>
                        <EventField field_name="Signature" field="alert.signature" value={data.alert.signature} addFilter={this.addFilter} />
                      </ErrorHandler>
                      <ErrorHandler>
                        <EventField field_name="SID" field="alert.signature_id" value={data.alert.signature_id} addFilter={this.addFilter} />
                      </ErrorHandler>
                      <ErrorHandler>
                        <EventField field_name="Category" field="alert.category" value={data.alert.category} addFilter={this.addFilter} />
                      </ErrorHandler>
                      <ErrorHandler>
                        <EventField
                          field_name="Severity"
                          field="alert.severity"
                          value={data.alert.severity}
                          addFilter={this.addFilter}
                          format={(dashboard.sections.basic.items.find((o) => o.i === 'alert.severity') || {}).format}
                        />
                      </ErrorHandler>
                      <ErrorHandler>
                        <EventField field_name="Revision" field="alert.rev" value={data.alert.rev} addFilter={this.addFilter} />
                      </ErrorHandler>
                      {data.alert.tag && (
                        <ErrorHandler>
                          <EventField field_name="Tagged" field="alert.tag" value={data.alert.tag} addFilter={this.addFilter} />
                        </ErrorHandler>
                      )}
                    </dl>
                  </div>
                </div>
              </Col>

        return (
            <ListViewItem
                id={this.props.id}
                leftContent={<ListViewIcon type="fa" name="bell" className={iconclass} />}
                description={<span data-toggle="tooltip" title={data.alert.signature}>{data.alert.signature}</span>}
                heading={ipParams}
                additionalInfo={addInfo}
                onExpand={() => this.fetchData(data.flow_id)}
                onExpandClose={() => this.setState({ showTabs: false })}
            >
                <Tabs id="alert-tabs">
                    <Tab eventKey="alert" title="Synthetic view">
                        <Row>
                            <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5 className="card-title">Signature</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            <ErrorHandler>
                                                <EventField field_name="Signature" field="alert.signature" value={data.alert.signature} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="SID" field="alert.signature_id" value={data.alert.signature_id} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Category" field="alert.category" value={data.alert.category} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Severity" field="alert.severity" value={data.alert.severity} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Revision" field="alert.rev" value={data.alert.rev} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            {data.alert.tag && <ErrorHandler><EventField field_name="Tagged" field="alert.tag" value={data.alert.tag} addFilter={this.addFilter} /></ErrorHandler>}
                                        </dl>
                                    </div>
                                </div>
                            </Col>

                            <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>IP and basic information</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            {data.net_info && data.net_info.src_agg && <ErrorHandler><EventField field_name="Source Network" field="net_info.src_agg" value={data.net_info.src_agg} addFilter={this.addFilter} /></ErrorHandler>}
                                            <ErrorHandler>
                                                <EventField field_name="Source IP" field="src_ip" value={data.src_ip} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Source port" field="src_port" value={data.src_port} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            {data.net_info && data.net_info.dest_agg && <ErrorHandler><EventField field_name="Destination Network" field="net_info.dest_agg" value={data.net_info.dest_agg} addFilter={this.addFilter} /></ErrorHandler>}
                                            <ErrorHandler>
                                                <EventField field_name="Destination IP" field="dest_ip" value={data.dest_ip} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Destination port" field="dest_port" value={data.dest_port} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="IP protocol" field="proto" value={data.proto} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            {data.app_proto && <ErrorHandler><EventField field_name="Application protocol" field="app_proto" value={data.app_proto} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.app_proto_orig && <ErrorHandler><EventField field_name="Original application protocol" field="app_proto_orig" value={data.app_proto_orig} addFilter={this.addFilter} /></ErrorHandler>}
                                            <ErrorHandler>
                                                <EventField field_name="Probe" field="host" value={data.host} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Network interface" field="in_iface" value={data.in_iface} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            {data.vlan && <ErrorHandler><EventField field_name="Vlan" field="vlan" value={data.vlan} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.tunnel && data.tunnel.src_ip && <ErrorHandler><EventField field_name="Tunnel Source IP" field="tunnel.src_ip" value={data.tunnel.src_ip} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.tunnel && data.tunnel.dest_ip && <ErrorHandler><EventField field_name="Tunnel Destination IP" field="tunnel.dest_ip" value={data.tunnel.dest_ip} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.tunnel && data.tunnel.proto && <ErrorHandler><EventField field_name="Tunnel Protocol" field="tunnel.proto" value={data.tunnel.proto} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.tunnel && data.tunnel.depth && <ErrorHandler><EventField field_name="Tunnel Depth" field="tunnel.depth" value={data.tunnel.depth} addFilter={this.addFilter} /></ErrorHandler>}
                                        </dl>
                                    </div>
                                </div>
                            </Col>

                            <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>Enrichment</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            {hasTarget && <React.Fragment>
                                                {sourceNetwork}
                                                <ErrorHandler>
                                                    <EventField field_name="Source IP" field="alert.source.ip" value={data.alert.source.ip} addFilter={this.addFilter} />
                                                </ErrorHandler>
                                                <ErrorHandler>
                                                    <EventField field_name="Source port" field="alert.source.port" value={data.alert.source.port} addFilter={this.addFilter} />
                                                </ErrorHandler>
                                                {targetNetwork}
                                                <ErrorHandler>
                                                    <EventField field_name="Target IP" field="alert.target.ip" value={data.alert.target.ip} addFilter={this.addFilter} />
                                                </ErrorHandler>
                                                <ErrorHandler>
                                                    <EventField field_name="Target port" field="alert.target.port" value={data.alert.target.port} addFilter={this.addFilter} />
                                                </ErrorHandler>
                                            </React.Fragment>}
                                            {hasLateral && <ErrorHandler><EventField field_name="Lateral movement" field="alert.lateral" value={data.alert.lateral} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.fqdn && data.fqdn.src && <ErrorHandler><EventField field_name="FQDN Source" field="fqdn.src" value={data.fqdn.src} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.fqdn && data.fqdn.dest && <ErrorHandler><EventField field_name="FQDN Destination" field="fqdn.dest" value={data.fqdn.dest} addFilter={this.addFilter} /></ErrorHandler>}
                                        </dl>
                                    </div>
                                </div>
                            </Col>

                            <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>Geoip</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            {data.geoip && data.geoip.country_name && <ErrorHandler><EventField field_name="Country" field="geoip.country_name" value={data.geoip.country_name} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.geoip && data.geoip.city_name && <ErrorHandler><EventField field_name="Country Code" field="geoip.country_code2" value={data.geoip.country_code2} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.geoip && data.geoip.provider && data.geoip.provider.autonomous_system_number && <ErrorHandler><EventField field_name="AS Number" field="geoip.provider.autonomous_system_number" value={data.geoip.provider.autonomous_system_number} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.geoip && data.geoip.provider && data.geoip.provider.autonomous_system_organization && <ErrorHandler><EventField field_name="AS Organization" field="geoip.provider.autonomous_system_organization" value={data.geoip.provider.autonomous_system_organization} addFilter={this.addFilter} /></ErrorHandler>}

                                        </dl>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            {data.http !== undefined && <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>HTTP</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            <ErrorHandler>
                                                <EventField field_name="Host" field="http.hostname" value={data.http.hostname} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="URL" field="http.url" value={data.http.url} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            {data.http.status !== undefined && <ErrorHandler><EventField field_name="Status" field="http.status" value={data.http.status} addFilter={this.addFilter} /></ErrorHandler>}
                                            <ErrorHandler>
                                                <EventField field_name="Method" field="http.http_method" value={data.http.http_method} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="User Agent" field="http.http_user_agent" value={data.http.http_user_agent} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            {data.http.http_refer !== undefined && <ErrorHandler><EventField field_name="Referrer" field="http.http_refer" value={data.http.http_refer} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.http.http_port !== undefined && <ErrorHandler><EventField field_name="Port" field="http.http_port" value={data.http.http_port} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.http.http_content_type !== undefined && <ErrorHandler><EventField field_name="Content Type" field="http.http_content_type" value={data.http.http_content_type} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data.http.length !== undefined && <ErrorHandler><EventField field_name="Length" field="http.length" value={data.http.length} addFilter={this.addFilter} /></ErrorHandler>}
                                        </dl>
                                    </div>
                                </div>
                            </Col>}
                            {data.tls !== undefined && <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>TLS</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            <ErrorHandler>
                                                <EventField field_name="Subject" field="tls.subject" value={data.tls.subject} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Issuer" field="tls.issuerdn" value={data.tls.issuerdn} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Server Name Indication" field="tls.sni" value={data.tls.sni} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Not Before" field="tls.notbefore" value={data.tls.notbefore} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Not After" field="tls.notafter" value={data.tls.notafter} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            {(data.tls.ja3 && data.tls.ja3.hash !== undefined) && <ErrorHandler><EventField field_name="JA3" field="tls.ja3.hash" value={data.tls.ja3.hash} addFilter={this.addFilter} /></ErrorHandler>}
                                            {(data.tls.ja3 && data.tls.ja3.agent !== undefined) && data.tls.ja3.agent.map((agent, idx) => (
                                                <ErrorHandler key={Math.random()}>
                                                    {/* eslint-disable-next-line react/no-array-index-key */}
                                                    <EventField field_name="User-Agent" field="tls.ja3.agent" value={agent} addFilter={this.addFilter} key={`to-${idx}`} />
                                                </ErrorHandler>
                                            ))}
                                            {(data.tls.ja3s && data.tls.ja3s.hash !== undefined) && <ErrorHandler><EventField field_name="JA3S" field="tls.ja3s.hash" value={data.tls.ja3s.hash} addFilter={this.addFilter} /></ErrorHandler>}
                                        </dl>
                                    </div>
                                </div>
                            </Col>}
                            {data.smtp !== undefined && <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>SMTP</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            {(data.smtp.mail_from !== undefined) && <ErrorHandler><EventField field_name="From" field="smtp.mail_from" value={data.smtp.mail_from} addFilter={this.addFilter} /></ErrorHandler>}
                                            {(data.smtp.rcpt_to !== undefined) && data.smtp.rcpt_to.map((mail, idx) => (
                                                <ErrorHandler key={Math.random()}>
                                                    {/* eslint-disable-next-line react/no-array-index-key */}
                                                    <EventField field_name="To" field="smtp.rcpt_to" value={mail} addFilter={this.addFilter} key={`to-${idx}`} />
                                                </ErrorHandler>
                                            ))}
                                            {(data.smtp.helo !== undefined) && <ErrorHandler><EventField field_name="Helo" field="smtp.helo" value={data.smtp.helo} addFilter={this.addFilter} /></ErrorHandler>}
                                        </dl>
                                    </div>
                                </div>
                            </Col>}
                            {data.ssh !== undefined && <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>SSH</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            {data.ssh.client && <React.Fragment>
                                                <ErrorHandler>
                                                    <EventField field_name="Client Software" field="ssh.client.software_version" value={data.ssh.client.software_version} addFilter={this.addFilter} />
                                                </ErrorHandler>
                                                <ErrorHandler>
                                                    <EventField field_name="Client Version" field="ssh.client.proto_version" value={data.ssh.client.proto_version} addFilter={this.addFilter} />
                                                </ErrorHandler>
                                            </React.Fragment>}
                                            {data.ssh.server && <React.Fragment>
                                                <ErrorHandler>
                                                    <EventField field_name="Server Software" field="ssh.server.software_version" value={data.ssh.server.software_version} addFilter={this.addFilter} />
                                                </ErrorHandler>
                                                <ErrorHandler>
                                                    <EventField field_name="Server Version" field="ssh.server.proto_version" value={data.ssh.server.proto_version} addFilter={this.addFilter} />
                                                </ErrorHandler>
                                            </React.Fragment>}
                                        </dl>
                                    </div>
                                </div>
                            </Col>}
                            {data.smb !== undefined && <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>SMB</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            {data.smb.command !== undefined && <ErrorHandler><EventField
                                                field_name="Command"
                                                field="smb.command"
                                                value={data.smb.command}
                                                addFilter={this.addFilter}
                                            /></ErrorHandler>}
                                            {data.smb.status !== undefined && <ErrorHandler><EventField
                                                field_name="Status"
                                                field="smb.status"
                                                value={data.smb.status}
                                                addFilter={this.addFilter}
                                            /></ErrorHandler>}
                                            {data.smb.filename !== undefined && <ErrorHandler><EventField
                                                field_name="Filename"
                                                field="smb.filename"
                                                value={data.smb.filename}
                                                addFilter={this.addFilter}
                                            /></ErrorHandler>}
                                            {data.smb.share !== undefined && <ErrorHandler><EventField
                                                field_name="Share"
                                                field="smb.share"
                                                value={data.smb.share}
                                                addFilter={this.addFilter}
                                            /></ErrorHandler>}
                                            {data.smb.session_id !== undefined && <ErrorHandler><EventField
                                                field_name="Session ID"
                                                field="smb.session_id"
                                                value={data.smb.session_id}
                                                addFilter={this.addFilter}
                                            /></ErrorHandler>}
                                        </dl>
                                    </div>
                                </div>
                            </Col>}
                            {(data.dns !== undefined && dnsQuery !== undefined) && <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>DNS</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            {dnsQuery.rrname !== undefined && <ErrorHandler><EventField
                                                field_name="Queried Name"
                                                field="dns.query.rrname"
                                                value={dnsQuery.rrname}
                                                addFilter={this.addFilter}
                                            /></ErrorHandler>}
                                            {dnsQuery.rrtype !== undefined && <ErrorHandler><EventField
                                                field_name="Queried Type"
                                                field="dns.query.rrtype"
                                                value={dnsQuery.rrtype}
                                                addFilter={this.addFilter}
                                            /></ErrorHandler>}
                                        </dl>
                                    </div>
                                </div>
                            </Col>}
                            {data['ftp-data'] !== undefined && <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>FTP data</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            {data['ftp-data'].command !== undefined && <ErrorHandler><EventField field_name="Command" field="ftp-data.command" value={data['ftp-data'].command} addFilter={this.addFilter} /></ErrorHandler>}
                                            {data['ftp-data'].filename !== undefined && <ErrorHandler><EventField field_name="Filename" field="ftp-data.filename" value={data['ftp-data'].filename} addFilter={this.addFilter} /></ErrorHandler>}
                                        </dl>
                                    </div>
                                </div>
                            </Col>}
                            {data.flow !== undefined && <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>Flow</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            <ErrorHandler>
                                                <EventField field_name="Flow ID" field="flow_id" value={data.flow_id} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Flow start" field="flow.start" value={data.flow.start} addFilter={this.addFilter} magnifiers={false} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Pkts to server" field="flow.pkts_toserver" value={data.flow.pkts_toserver} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Bytes to server" field="flow.bytes_toserver" value={data.flow.bytes_toserver} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Pkts to client" field="flow.pkts_toclient" value={data.flow.pkts_toclient} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                            <ErrorHandler>
                                                <EventField field_name="Bytes to client" field="flow.bytes_toclient" value={data.flow.bytes_toclient} addFilter={this.addFilter} />
                                            </ErrorHandler>
                                        </dl>
                                    </div>
                                </div>
                            </Col>}
                            {data.alert.metadata && <Col sm={4}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>Signature metadata</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <dl className="dl-horizontal">
                                            {
                                                Object.entries(data.alert.metadata).map((field) => {
                                                    const value = (field[1] === null) ? '' : field[1].join(', ');
                                                    const key = (field[0] === null) ? '' : field[0];
                                                    return (
                                                        <React.Fragment key={key}>
                                                            <ErrorHandler><EventField field_name={key} field={`alert.metadata.${key}`} value={value} addFilter={this.addFilter} /></ErrorHandler>
                                                        </React.Fragment>
                                                    )
                                                })
                                            }
                                        </dl>
                                    </div>
                                </div>
                            </Col>}
                        </Row>
                        {data.payload_printable && <Row>
                            <Col sm={12}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>Payload printable</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <pre style={{ maxHeight: '12pc' }}>{data.payload_printable}</pre>
                                    </div>
                                </div>

                            </Col>
                        </Row>}
                        {data.http && <Row>
                            {data.http.http_request_body_printable && <Col sm={6}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>HTTP request body</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <pre style={{ maxHeight: '12pc' }}>{data.http.http_request_body_printable}</pre>
                                    </div>
                                </div>
                            </Col>}
                            {data.http.http_response_body_printable && <Col sm={6}>
                                <div className="card-pf">
                                    <div className="card-pf-heading">
                                        <h5>HTTP response body</h5>
                                    </div>
                                    <div className="card-pf-body">
                                        <pre style={{ maxHeight: '12pc' }}>{data.http.http_response_body_printable}</pre>
                                    </div>
                                </div>
                            </Col>}
                        </Row>}
                    </Tab>
                    {showTabs && <Tab eventKey="json-alert" title="JSON View">
                        <ReactJson
                            name={false}
                            src={data}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            collapseStringsAfterLength={150}
                            collapsed={false}
                        />
                    </Tab>}
                    {showTabs && <Tab eventKey="json-related" title={this.formatString('Related events {0}', this.nbEvents(events))}>
                        <div style={{ paddingTop: '10px' }}>
                            <Spinner loading={events === undefined} size="xs">
                                {events && <Tabs id="related-tabs">
                                    {Object.keys(events).sort().map((key) => (
                                        <Tab eventKey={`events-${key}`} title={`Related ${key}${key === 'Alert' && Object.keys(events[key]).length > 1 ? 's' : ''} (${Object.keys(events[key]).length})`} key={`events-${key}`}>
                                            {Object.keys(events[key]).sort().map((key2) => (
                                                <div key={key2} style={{ paddingTop: '10px' }}>
                                                    <a style={{ cursor: 'pointer' }} onClick={() => this.toggleCollapse(`${key}-${key2}`)} key={key2}>
                                                        {`${key}-${key2}` in this.state.collapsed && !this.state.collapsed[`${key}-${key2}`] && <span className="fa fa-angle-right fa-angle-down"></span>}
                                                        {!(`${key}-${key2}` in this.state.collapsed && !this.state.collapsed[`${key}-${key2}`]) && <span className="fa fa-angle-right fa-angle-right"></span>}
                                                        <strong>{`  ${this.getTitle(events[key][key2])}`}</strong>
                                                    </a>
                                                    {`${key}-${key2}` in this.state.collapsed && !this.state.collapsed[`${key}-${key2}`] && <ReactJson
                                                        name={false}
                                                        src={events[key][key2]}
                                                        displayDataTypes={false}
                                                        displayObjectSize={false}
                                                        collapseStringsAfterLength={150}
                                                        collapsed={false}
                                                    />}
                                                </div>
                                            ))}
                                        </Tab>))}
                                    {Object.keys(events).length === 0 && <strong>No related events</strong>}
                                </Tabs>}
                            </Spinner>
                        </div>
                    </Tab>}
                </Tabs>
            </ListViewItem>
        );
    }
}
AlertItem.propTypes = {
    id: PropTypes.any,
    data: PropTypes.any,
    addFilter: PropTypes.func,
    filterParams: PropTypes.object.isRequired
};
