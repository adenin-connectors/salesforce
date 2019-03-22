'use strict';
const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    const response = await api('/v26.0/sobjects/case');

    if (!cfActivity.isResponseOk(activity, response)) {
      return;
    }

    let tickets = [];
    if (response.body.recentItems) {
      tickets = response.body.recentItems;
    }

    let salesforceDomain = api.getDomain();

    let ticketStatus = {
      title: 'Active Tickets',
      url: `https://${salesforceDomain}/lightning/o/Case/list?filterName=Recent`,
      urlLabel: 'All tickets',
    };

    let ticketCount = tickets.length;

    if (ticketCount != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: `You have ${ticketCount > 1 ? ticketCount + " tickets" : ticketCount + " ticket"}.`,
        color: 'blue',
        value: ticketCount,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: `You have no tickets.`,
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    cfActivity.handleError(activity, error);
  }
};