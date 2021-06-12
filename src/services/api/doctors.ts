const get = () => {
  return { id: 'id', name: 'nader' };
};

const list = () => {
  return [
    { id: 'id', name: 'nader' },
    { id: 'id', name: 'nader' },
  ];
};

const availability = () => {
  return [
    { id: 'id', startDate: '2011-01-01', endDate: '2011-01-01' },
    { id: 'id', startDate: '2011-01-01', endDate: '2011-01-01' },
  ];
};

export default { get, list, availability };
