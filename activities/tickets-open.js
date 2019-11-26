'use strict';

const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    const dateRange = $.dateRange(activity);

    const url = `/v26.0/query?q=SELECT Id,Subject,Description,OwnerId,CreatedDate,IsClosed FROM case WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} AND IsClosed = false ORDER BY CreatedDate DESC`;
    const valueUrl = `/v40.0/query?q=SELECT COUNT(Id) FROM case WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} AND IsClosed = false`;

    const promises = [];

    promises.push(api.sendRequestWithPagination(url));
    promises.push(api(valueUrl));

    const responses = await Promise.all(promises);

    for (let i = 0; i < responses.length; i++) {
      if ($.isErrorResponse(activity, responses[i])) return;
    }

    const tickets = responses[0];
    const value = responses[1].body.records[0].expr0;

    const pagination = $.pagination(activity);

    activity.Response.Data.items = api.mapObjectsToItems(tickets.body.records, 'Case');

    if (parseInt(pagination.page) === 1) {
      const salesforceDomain = api.getDomain();

      activity.Response.Data.title = T(activity, 'Open Tickets');
      activity.Response.Data.link = `https://${salesforceDomain}/lightning/o/Case/list`;
      activity.Response.Data.linkLabel = T(activity, 'All Tickets');
      activity.Response.Data.actionable = value > 0;
      activity.Response.Data.thumbnail = 'https://www.adenin.com/assets/images/wp-images/logo/salesforce.svg';

      if (value > 0) {
        activity.Response.Data.value = value;
        activity.Response.Data.date = activity.Response.Data.items[0].date;
        activity.Response.Data.description = value > 1 ? T(activity, 'You have {0} open tickets.', value) : T(activity, 'You have 1 open ticket.');
      } else {
        activity.Response.Data.description = T(activity, 'You have no open tickets.');
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};
