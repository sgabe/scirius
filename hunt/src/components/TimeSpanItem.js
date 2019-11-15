import React from 'react';
import { Col,
    DropdownButton,
    FormControl,
    FormGroup,
    Icon,
    InputGroup,
    MenuItem,
    Row } from 'patternfly-react';
import moment from 'moment';
import * as PropTypes from 'prop-types';
import OutsideClickHandler from 'react-outside-click-handler';
import DateRangePicker from './DateRangePicker';

const USER_PERIODS = {
    3600: '1h',
    21600: '6h',
    86400: '24h',
    172800: '2d',
    604800: '7d',
    2592000: '30d'
};

const moments = [
    { label: 'Please select' },
    { label: 'Seconds ago', get: (val) => moment().second(moment().second() - val) },
    { label: 'Minutes ago', get: (val) => moment().minute(moment().minute() - val) },
    { label: 'Hours ago', get: (val) => moment().hour(moment().hour() - val) },
    { label: 'Days ago', get: (val) => moment().day(moment().day() - val) },
    { label: 'Weeks ago', get: (val) => moment().week(moment().week() - val) },
    { label: 'Months ago', get: (val) => moment().month(moment().month() - val) },
    { label: 'Years ago', get: (val) => moment().year(moment().year() - val) },
    { label: 'Seconds from now', get: (val) => moment().second(moment().second() + val) },
    { label: 'Minutes from now', get: (val) => moment().minute(moment().minute() + val) },
    { label: 'Hours from now', get: (val) => moment().hour(moment().hour() + val) },
    { label: 'Days from now', get: (val) => moment().day(moment().day() + val) },
    { label: 'Weeks from now', get: (val) => moment().week(moment().week() + val) },
    { label: 'Months from now', get: (val) => moment().month(moment().month() + val) },
    { label: 'Years from now', get: (val) => moment().year(moment().year() + val) },
];

export default class TimeSpanItem extends React.Component {
    constructor(props) {
        super(props);
        this.format = 'MMMM Do YYYY, HH:mm:ss';

        this.state = {
            picker: 1,
            from: {
                id: 0,
                value: 0,
                time: moment(),
                now: false,
            },
            to: {
                id: 0,
                value: 0,
                time: moment(),
                now: false,
            }
        }
    }

    renderInputField = (type) => (
        <FormControl
            type="number"
            disabled={(this.state[type].id === 0)}
            style={{ width: '100px' }}
            min={1}
            value={(this.state[type].value === 0) ? '' : this.state[type].value}
            onChange={(e) => this.setState({
                [type]: {
                    ...this.state[type],
                    value: e.target.value === '' ? 0 : Math.abs(parseInt(e.target.value, 10)),
                    time: e.target.value.length ? moments[this.state[type].id].get(parseInt(e.target.value, 10)) : moment(),
                }
            })}
        />
    );

    renderDropDownField = (type) => (
        <DropdownButton
            id="input-dropdown-addon"
            title={moments[this.state[type].id].label}
            style={{ width: '135px' }}
        >
            {
                Object.keys(moments).map((i) => <MenuItem
                    key={`${type}-${moments[i].label}`}
                    onClick={() => {
                        this.setState({
                            [type]: {
                                ...this.state[type],
                                id: parseInt(i, 10),
                                time: this.state[type].value > 0 ? moments[i].get(this.state[type].value) : moment(),
                                now: false,
                            }
                        })
                    }}
                >{moments[i].label}</MenuItem>)
            }
        </DropdownButton>
    );

    renderSetToNow = (type) => (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                this.setState({
                    [type]: {
                        ...this.state[type],
                        now: !this.state[type].now,
                        disabled: true,
                        id: 0,
                        value: 0,
                    }
                })
            }}
        >{(this.state[type].now) ? '×' : 'Set to now'}</a>
    );

    renderRounder = (type) => (
        <React.Fragment>
            <input
                type="checkbox"
                id={`${type}-RoundToSecs`}
                onClick={(e) => {
                    this.setState({
                        [type]: {
                            ...this.state[type],
                            time: this.toggleRound(e.target.checked)
                        }
                    });
                }}
            /> <label htmlFor={`${type}-RoundToSecs`}>Round to seconds</label>
        </React.Fragment>
    );

    toggleRound = (checked) => {
        if (checked) {
            return moment().minutes(0).seconds(0).format(this.format)
        }
        return moment().format(this.format);
    }

    render() {
        return (
            <li>
                <div
                    tabIndex={0}
                    data-toggle="tooltip"
                    title="Picker"
                    onClick={(e) => {
                        e.preventDefault();
                        this.setState((prevState) => ({
                            timeSpanPicker: !prevState.timeSpanPicker
                        }));
                    }}
                    role="button"
                    className="nav-item-iconic"
                    style={{ paddingTop: '23px', cursor: 'pointer' }}
                >
                    <Icon type="fa" name="clock-o" /> Last {USER_PERIODS[this.props.period]}
                </div>

                {this.state.timeSpanPicker && <div className="timespan-picker">
                    <OutsideClickHandler onOutsideClick={() => this.setState((prevState) => ({ timeSpanPicker: !prevState.timeSpanPicker }))}>
                    <ul className="time-pickers">
                        <li><a href="#" className={`picker ${this.state.picker === 1 ? 'active' : ''}`} onMouseOver={() => this.setState({ picker: 1 })}>Predefined</a></li>
                        <li><a href="#" className={`picker ${this.state.picker === 2 ? 'active' : ''}`} onMouseOver={() => this.setState({ picker: 2 })}>Absolute</a></li>
                        <li><a href="#" className={`picker ${this.state.picker === 3 ? 'active' : ''}`} onMouseOver={() => this.setState({ picker: 3 })}>Relative</a></li>
                    </ul>
                    <div style={{ clear: 'both' }} />
                    <div className="pickers-content">
                        <div className={`picker ${this.state.picker === 1 ? 'active' : ''}`}>
                            <ul className="hardcoded-stamps">
                                {Object.keys(USER_PERIODS).map((period) => (<li key={period}>
                                    <a
                                        href="#"
                                    >Last {USER_PERIODS[period]}</a></li>))
                                }
                            </ul>
                        </div>
                        <div className={`picker ${this.state.picker === 2 ? 'active' : ''}`}>
                            <DateRangePicker />
                        </div>
                        <div className={`picker ${this.state.picker === 3 ? 'active' : ''}`}>
                            <Row className="relative-stamps ">
                                <Col md={6} className="from">
                                    <Row className="no-row">
                                        <Col md={6}>From</Col>
                                        <Col md={6} className="set-to-now">
                                            {this.renderSetToNow('from')}
                                        </Col>
                                    </Row>
                                    <div style={{ clear: 'both' }} />
                                    <div className="time-label">{(this.state.from.now) ? 'Now' : this.state.from.time.format(this.format)}</div>
                                    <FormGroup controlId="control-6">
                                        <InputGroup>
                                            {this.renderInputField('from')}
                                            {this.renderDropDownField('from')}
                                        </InputGroup>
                                    </FormGroup>
                                    {!this.state.from.now && this.renderRounder('from')}
                                </Col>
                                <Col md={6} className="to">
                                    <Row className="no-gutter">
                                        <Col md={6}>To</Col>
                                        <Col md={6} className="set-to-now">
                                            {this.renderSetToNow('to')}
                                        </Col>
                                    </Row>
                                    <div style={{ clear: 'both' }} />
                                    <div className="time-label">{(this.state.to.now) ? 'Now' : this.state.to.time.format(this.format)}</div>
                                    <FormGroup controlId="control-7">
                                        <InputGroup>
                                            {this.renderInputField('to')}
                                            {this.renderDropDownField('to')}
                                        </InputGroup>
                                    </FormGroup>
                                    {!this.state.to.now && this.renderRounder('to')}
                                </Col>
                            </Row>
                            <Row>
                                <div style={{ textAlign: 'center', padding: '15px 15px 0px', borderTop: '1px solid #e9e9e9', marginTop: '8px' }}>
                                    <a
                                        href="#"
                                    >
                                        Submit
                                    </a>
                                </div>
                            </Row>
                        </div>
                    </div>
                    </OutsideClickHandler>
                </div>}
            </li>
        )
    }
}

TimeSpanItem.propTypes = {
    period: PropTypes.any,
};