'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    const dateRange = $.dateRange(activity);

    const url = `/v40.0/query?q=SELECT Id,FirstName,LastName,CreatedDate,Company,Email,Status FROM lead WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} AND Status LIKE '%25Open%25' ORDER BY CreatedDate DESC`;
    const valueUrl = `/v40.0/query?q=SELECT COUNT(Id) FROM lead WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} AND Status LIKE '%25Open%25'`;

    const promises = [];

    promises.push(api.sendRequestWithPagination(url));
    promises.push(api(valueUrl));

    const responses = await Promise.all(promises);

    for (let i = 0; i < responses.length; i++) {
      if ($.isErrorResponse(activity, responses[i])) return;
    }

    const leads = responses[0].body.records;
    const value = responses[1].body.records[0].expr0;

    const pagination = $.pagination(activity);

    activity.Response.Data.items = api.mapLeadsToItems(leads);

    if (parseInt(pagination.page) === 1) {
      const salesforceDomain = api.getDomain();

      activity.Response.Data.title = T(activity, 'Open Leads');
      activity.Response.Data.link = `https://${salesforceDomain}/lightning/o/Lead/list`;
      activity.Response.Data.linkLabel = T(activity, 'All Leads');
      activity.Response.Data.actionable = value > 0;
      activity.Response.Data.thumbnail = 'https://www.adenin.com/assets/images/wp-images/logo/salesforce.svg';

      if (value > 0) {
        const first = activity.Response.Data.items[0];

        activity.Response.Data.value = value;
        activity.Response.Data.date = first.date;
        activity.Response.Data.description = value > 1 ? T(activity, 'You have {0} open leads.', value) : T(activity, 'You have 1 open lead.');

        if (first.raw.Company) {
          activity.Response.Data.briefing = `You have an open lead from <b>${first.raw.Company}</b>`;

          if (value > 1) activity.Response.Data.briefing += value > 2 ? ` and ${value - 1} more open leads` : ' and 1 more open lead';
        } else {
          activity.Response.Data.briefing = activity.Response.Data.description + ` The latest is <b>${first.title}</b>`;
        }
      } else {
        activity.Response.Data.description = T(activity, 'You have no open leads.');
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};
