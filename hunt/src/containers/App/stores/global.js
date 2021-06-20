// CONSTANTS
import { fromJS } from 'immutable';
import { createSelector } from 'reselect';
import { sections } from 'hunt_common/constants';
import storage from '../../../helpers/storage';

export const ADD_FILTER = 'Hunt/App/ADD_FILTER';
export const REMOVE_FILTER = 'Hunt/App/REMOVE_FILTER';
export const EDIT_FILTER = 'Hunt/App/EDIT_FILTER';
export const CLEAR_FILTERS = 'Hunt/App/CLEAR_FILTERS';
export const SET_ALERT = 'Hunt/App/SET_ALERT';
export const SET_ONLY_ONE_ALERT = 'Hunt/App/SET_ONLY_ONE_ALERT';
export const GET_USER_DETAILS_REQUEST = 'Hunt/App/GET_USER_DETAILS_REQUEST';
export const GET_USER_DETAILS_SUCCESS = 'Hunt/App/GET_USER_DETAILS_SUCCESS';
export const GET_USER_DETAILS_FAILURE = 'Hunt/App/GET_USER_DETAILS_FAILURE';

export const validateFilter = (filter) => {
    if (filter.id === 'alert.tag') {
        // eslint-disable-next-line no-console
        console.error('Tags must go in a separate store');
        return false;
    }

    const filterProps = ['id', 'value', 'negated', 'label', 'fullString', 'query'];

    const filterKeys = Object.keys(filter);
    for (let i = 0; i < filterKeys.length; i += 1) {
        if (!filterProps.find((filterProp) => filterProp === filterProps[i])) { return false }
    }
    return true;
}

export const generateAlert = (informational = true, relevant = true, untagged = true) => ({
    id: 'alert.tag',
    value: { informational, relevant, untagged }
});

export const generateDefaultRequest = () => ({
  request: {
    loading: false,
    status: null,
    message: '',
  },
});

export const updateStorage = (filterType, filters) => {
    storage.setItem(filterType, JSON.stringify(filters));
}

export const loadStorage = (filtersType) => {
    const initialFilterSet = undefined;
    let result;
    try {
        const cached = JSON.parse(storage.getItem(filtersType));
        result = (typeof cached === 'undefined') ? initialFilterSet : cached;
    } catch (e) {
        result = initialFilterSet;
    }
    return result;
}

export function addFilter(filterType, filter) {
    return {
        type: ADD_FILTER,
        filterType,
        filter
    };
}
export function removeFilter(filterType, filter) {
    return {
        type: REMOVE_FILTER,
        filterType,
        filter
    };
}
export function editFilter(filterType, filter, filterUpdated) {
    return {
        type: EDIT_FILTER,
        filterType,
        filter,
        filterUpdated
    };
}
export function clearFilters(filterType) {
    return {
        type: CLEAR_FILTERS,
        filterType
    };
}
export function setTag(tagType, tagState) {
    return {
        type: SET_ALERT,
        tagType,
        tagState,
    }
}
export function enableOnly(filterType) {
    return {
        type: SET_ONLY_ONE_ALERT,
        filterType
    }
}

export function getUserDetails() {
  return {
    type: GET_USER_DETAILS_REQUEST,
  };
}
export function getUserDetailsSuccess(data) {
  return {
    type: GET_USER_DETAILS_SUCCESS,
    payload: {
      data,
    },
  };
}
export function getUserDetailsFailure(error) {
  return {
    type: GET_USER_DETAILS_FAILURE,
    payload: {
      error,
    },
  };
}

// REDUCER
const initialState = fromJS({
  filters: {
    [sections.GLOBAL]: loadStorage(sections.GLOBAL) || [],
    [sections.HISTORY]: loadStorage(sections.HISTORY) || [],
    [sections.ALERT]: loadStorage(sections.ALERT) || generateAlert(),
  },
  [sections.USER]: {
    data: loadStorage(sections.USER) || {},
    ...generateDefaultRequest(),
  },
});

function indexOfFilter(filter, allFilters) {
    for (let idx = 0; idx < allFilters.length; idx += 1) {
        if (allFilters[idx].label === filter.label && allFilters[idx].id === filter.id && allFilters[idx].value === filter.value && allFilters[idx].negated === filter.negated && allFilters[idx].query === filter.query && allFilters[idx].fullString === filter.fullString) {
            return idx;
        }
    }
    return -1;
}

export const reducer = (state = initialState, action) => {
    switch (action.type) {
        case ADD_FILTER: {
            const { filter } = action;
            const globalFilters = state.getIn(['filters', action.filterType]).toJS();
            // When an array of filters is passed
            if (Array.isArray(filter)) {
                for (let i = 0; i < filter.length; i += 1) {
                    if (validateFilter(filter[i])) {
                        globalFilters.push(filter[i]);
                    }
                }
            // When a single filter is passed
            } else if (validateFilter(filter)) {
                globalFilters.push(filter);
            }
            updateStorage(action.filterType, globalFilters);
            return state.setIn(['filters', action.filterType], fromJS(globalFilters));
        }
        case EDIT_FILTER: {
            if (!validateFilter(action.filterUpdated)) { return state }
            const globalFilters = state.getIn(['filters', action.filterType]).toJS();
            const idx = indexOfFilter(action.filter, globalFilters);
            /* eslint-disable-next-line */
            const updatedGlobalFilters = globalFilters.map((filter, i) => (i === idx) ? {
                    ...filter,
                    ...action.filterUpdated,
                  }
                : filter,
            );
            updateStorage(action.filterType, updatedGlobalFilters);
            return state.setIn(['filters', action.filterType], fromJS(updatedGlobalFilters));
        }
        case REMOVE_FILTER: {
            const globalFilters = state.getIn(['filters', action.filterType]).toJS();

            const idx = indexOfFilter(action.filter, globalFilters);
            const before = globalFilters.slice(0, idx);
            const after = globalFilters.slice(idx + 1);

            const updatedGlobalFilters = [...before, ...after];
            updateStorage(action.filterType, updatedGlobalFilters);
            return state.setIn(['filters', action.filterType], fromJS(updatedGlobalFilters));
        }
        case CLEAR_FILTERS: {
            updateStorage(action.filterType, []);
            return state.setIn(['filters', action.filterType], fromJS([]));
        }
        case SET_ALERT: {
            let updatedAlert;
            // If an entire object is passed
            if (typeof action.tagType === 'object' && action.tagType !== null) {
                updatedAlert = state.setIn(['filters', sections.ALERT], fromJS(action.tagType));
            // Or a single alert tag value
            } else {
                updatedAlert = state.setIn(['filters', sections.ALERT, 'value', action.tagType], action.tagState);
            }
            updateStorage(sections.ALERT, updatedAlert.getIn(['filters', sections.ALERT]).toJS());
            return updatedAlert;
        }
        case SET_ONLY_ONE_ALERT: {
            const { filterType } = action;
            const updatedAlert = state.setIn(['filters', sections.ALERT], fromJS(generateAlert(filterType === 'informational' || filterType === 'all', filterType === 'relevant' || filterType === 'all', filterType === 'untagged' || filterType === 'all')));
            updateStorage(sections.ALERT, updatedAlert.getIn(['filters', sections.ALERT]).toJS());
            return updatedAlert;
        }
        default:
            return state;
    }
    case GET_USER_DETAILS_REQUEST: {
      return state.setIn(
        [sections.USER],
        fromJS({
          data: { ...state.getIn([sections.USER]).toJS().data },
          request: {
            loading: true,
            status: null,
            message: '',
          },
        }),
      );
    }
    case GET_USER_DETAILS_SUCCESS: {
      updateStorage(sections.USER, action.payload.data);
      return state.setIn(
        [sections.USER],
        fromJS({
          request: {
            loading: false,
            status: true,
            message: 'Success',
          },
          data: action.payload.data,
        }),
      );
    }
    case GET_USER_DETAILS_FAILURE:
      return state.setIn(
        [sections.USER],
        fromJS({
          request: {
            loading: true,
            status: false,
            message: 'Failure',
          },
          data: { ...state.getIn([sections.USER]).toJS().data },
        }),
      );
    default:
      return state;
  }
};

// SELECTORS
export const selectGlobal = (state) => state.get('global');
export const makeSelectGlobalFilters = (includeAlertTag = false) => createSelector(selectGlobal, (globalState) => {
    let result = globalState.getIn(['filters', sections.GLOBAL]).toJS();
    if (includeAlertTag) {
        result = [...result, globalState.getIn(['filters', sections.ALERT]).toJS()];
    }
    return result;
});
export const makeSelectHistoryFilters = () => createSelector(selectGlobal, (globalState) => globalState.getIn(['filters', sections.HISTORY]).toJS());
export const makeSelectAlertTag = () => createSelector(selectGlobal, (globalState) => globalState.getIn(['filters', sections.ALERT]).toJS());
export const makeSelectUserData = () =>
  createSelector(selectGlobal, (globalState) => {
    const userDetails = globalState.getIn([sections.USER]).toJS();
    const { data = {} } = userDetails;
    const {
      pk = '',
      timezone = '',
      username = '',
      first_name: firstName = '',
      last_name: lastName = '',
      is_active: isActive = false,
      email = '',
      date_joined: dateJoined = '',
      perms: permissions = [],
      no_tenant: noTenant = false,
    } = data;
    return {
      pk,
      timezone,
      username,
      firstName,
      lastName,
      isActive,
      email,
      dateJoined,
      permissions,
      noTenant,
    };
  });
export const makeSelectUserRequest = () => createSelector(selectGlobal, (globalState) => globalState.getIn(['user']).toJS().request);
