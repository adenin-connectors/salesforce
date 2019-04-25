'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    let url = `/v40.0/query?q=SELECT Id,Subject,Description FROM case`;
    const response = await api.sendRequestWithPagination(url);
    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data = api.mapTicketsAndTasksToItems(response.body.records, "Case");
  } catch (error) {
    $.handleError(activity, error);
  }
};