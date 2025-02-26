Handlebars.registerHelper("equals", function(a , b, options) {
    if (a === b) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper("grequal", function(a , b, options) {
    if (a >= b) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('truncateText', function (text, maxLength) {
    if (text.length <= maxLength) {
      return new Handlebars.SafeString(text);
    } else {
      const truncatedText = text.substring(0, maxLength) + '...';
      return new Handlebars.SafeString(
        `<span class="truncated-text">${truncatedText}</span><button class="read-more-btn" data-fulltext="${text}">Read More</button>`
      );
    }
  });
  
Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});
  