import DS from 'ember-data';

const { Model, attr, belongsTo } = DS;

export default Model.extend({
  createdAt:  attr('date'),
  disc:       attr('number'),
  genre:      attr('string'),
  name:       attr('string'),
  time:       attr('number'),
  track:      attr('number'),

  album:      belongsTo('album'),
  artist:     belongsTo('artist')
});
