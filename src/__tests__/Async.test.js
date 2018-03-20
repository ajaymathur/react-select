// @flow
import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import cases from 'jest-in-case';

import Async from '../Async';
import { OPTIONS } from './constants';
import { components } from '../components';
const { Option } = components;
const BASIC_PROPS = {
  components,
  backspaceRemovesValue: true,
  blurInputOnSelect: false,
  captureMenuScroll: true,
  closeMenuOnSelect: true,
  escapeClearsValue: false,
  filterOption: jest.fn(),
  formatGroupLabel: (group) => group.label,
  getOptionLabel: (option) => option.label,
  getOptionValue: (option) => option.value,
  hideSelectedOptions: true,
  inputValue: '',
  isDisabled: false,
  isLoading: false,
  isMulti: false,
  isOptionDisabled: jest.fn(() => false),
  isRtl: false,
  isSearchable: true,
  loadOptions: jest.fn(),
  loadingMessage: () => 'Loading...',
  maxMenuHeight: 300,
  maxValueHeight: 100,
  menuIsOpen: false,
  menuPlacement: 'bottom',
  minMenuHeight: 140,
  noOptionsMessage: () => 'No options',
  onChange: jest.fn(),
  onInputChange: jest.fn(),
  onMenuClose: jest.fn(),
  onMenuOpen: jest.fn(),
  options: OPTIONS,
  pageSize: 5,
  placeholder: 'Select...',
  screenReaderStatus: ({ count }: { count: number }) => `${count} result${count !== 1 ? 's' : ''} available.`,
  scrollMenuIntoView: false,
  styles: {},
  tabSelectsValue: true,
  value: [],
};

test('defaults - snapshot', () => {
  const tree = mount(<Async {...BASIC_PROPS}/>);
  expect(toJson(tree)).toMatchSnapshot();
});

/**
 * loadOptions with promise is not resolved and it renders loading options
 * confirmed by logging in component that loadOptions is resolved and options are available
 * but still loading options is rendered
 */
cases('load option prop with defaultOptions true', ({ props, expectOptionLength }) => {
  const asyncSelectWrapper = mount(<Async {...props} />);
  expect(asyncSelectWrapper.find(Option).length).toBe(expectOptionLength);
}, {
  'with callback  > should resolve options': {
    props: {
      ...BASIC_PROPS,
      defaultOptions: true,
      loadOptions: (inputValue, callBack) => callBack([OPTIONS[0]]),
      menuIsOpen: true,
    },
    expectOptionLength: 1,
  },
  'with promise  > should resolve options': {
    skip: true,
    props: {
      ...BASIC_PROPS,
      defaultOptions: true,
      loadOptions: () => Promise.resolve([OPTIONS[0]]),
      menuIsOpen: true,
    },
    expectOptionLength: 1,
  }
});

/**
 * loadOptions with promise is not resolved and it renders loading options
 * confirmed by logging in component that loadOptions is resolved and options are available
 * but still loading options is rendered
 */
cases('load options props with', ({ props, expectloadOptionsLength }) => {
  let asyncSelectWrapper = mount(<Async {...props} />);
  let inputValueWrapper = asyncSelectWrapper.find('div.react-select__input input');
  asyncSelectWrapper.setProps({ inputValue: 'a' });
  inputValueWrapper.simulate('change', { currentTarget: { value: 'a' } });
  expect(asyncSelectWrapper.find(Option).length).toBe(expectloadOptionsLength);
}, {
  'with callback > should resolve the options': {
    props: {
      ...BASIC_PROPS,
      loadOptions: (inputValue, callBack) => callBack(OPTIONS),
      menuIsOpen: true,
    },
    expectloadOptionsLength: 17,
  },
  'with promise > should resolve the options': {
    skip: true,
    props: {
      ...BASIC_PROPS,
      loadOptions: () => Promise.resolve(OPTIONS),
      menuIsOpen: true,
    },
    expectloadOptionsLength: 17,
  }
});

/**
 * Need to update porps to trigger on change in input
 * when updating props renders the component therefore options cache is lost thus loadOptions is called again
 */
test.skip('to not call loadOptions again for same value when cacheOptions is true', () => {
  let loadOptionsSpy = jest.fn();
  const props = { ...BASIC_PROPS, loadOptions: loadOptionsSpy, cacheOptions: true };
  let asyncSelectWrapper = mount(<Async {...props} />);
  let inputValueWrapper = asyncSelectWrapper.find('div.react-select__input input');

  asyncSelectWrapper.setProps({ inputValue: 'a' });
  inputValueWrapper.simulate('change', { currentTarget: { value: 'a' } });
  expect(loadOptionsSpy).toHaveBeenCalledTimes(1);

  asyncSelectWrapper.setProps({ inputValue: 'b' });
  inputValueWrapper.simulate('change', { target: { value: 'b' } ,currentTarget: { value: 'b' } });
  expect(loadOptionsSpy).toHaveBeenCalledTimes(2);

  asyncSelectWrapper.setProps({ inputValue: 'b' });
  inputValueWrapper.simulate('change', { currentTarget: { value: 'b' } });
  expect(loadOptionsSpy).toHaveBeenCalledTimes(2);
});

test('to create new cache for each instance', () => {
  const props = { ...BASIC_PROPS, cacheOptions: true };
  const asyncSelectWrapper = mount(<Async {...props} />);
  const instanceOne = asyncSelectWrapper.instance();

  const asyncSelectTwoWrapper = mount(<Async {...props} />);
  const instanceTwo = asyncSelectTwoWrapper.instance();

  expect(instanceOne.optionsCache).not.toBe(instanceTwo.optionsCache);
});

test('in case of callbacks display the most recently-requested loaded options (if results are returned out of order)', () => {
  let callbacks = [];
  const loadOptions = (inputValue, callback) => { callbacks.push(callback); };
  const props = { ...BASIC_PROPS, loadOptions, menuIsOpen: true };
  let asyncSelectWrapper = mount(<Async {...props} />);
  let inputValueWrapper = asyncSelectWrapper.find('div.react-select__input input');
  asyncSelectWrapper.setProps({ inputValue: 'foo' });
  inputValueWrapper.simulate('change', { currentTarget: { value: 'foo' } });
  asyncSelectWrapper.setProps({ inputValue: 'bar' });
  inputValueWrapper.simulate('change', { currentTarget: { value: 'bar' } });
  expect(asyncSelectWrapper.find(Option).exists()).toBeFalsy();
  callbacks[1]([{ value: 'bar', label: 'bar' }]);
  callbacks[0]([{ value: 'foo', label: 'foo' }]);
  asyncSelectWrapper.update();
  expect(asyncSelectWrapper.find(Option).text()).toBe('bar');
});

/**
 * This throws a jsdom exception
 */
test.skip('in case of callbacks should handle an error by setting options to an empty array', () => {
  // $FlowFixMe
  const loadOptions = (inputValue, callback) => { callback(new Error('error')); };
  const props = { ...BASIC_PROPS, loadOptions };
  let asyncSelectWrapper = mount(<Async {...props} />);
  let inputValueWrapper = asyncSelectWrapper.find('div.react-select__input input');
  asyncSelectWrapper.setProps({ inputValue: 'foo' });
  inputValueWrapper.simulate('change', { currentTarget: { value: 'foo' } });
  asyncSelectWrapper.update();
  expect(asyncSelectWrapper.find(Option).length).toBe(1);
});
