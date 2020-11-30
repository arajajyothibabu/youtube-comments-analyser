(function () {
  var COMMENTS = "ytd-comments";
  var COMMENT_THREAD = "ytd-comment-thread-renderer";
  var COMMENT = "ytd-comment-renderer";
  var COMMENT_REPLIES = "ytd-comment-replies-renderer";

  var REPLIES_BUTTON = "ytd-button-renderer#more-replies";
  var MORE_REPLIES_BUTTON = "yt-next-continuation";
  var VIEW_REPLIES_BUTTON =
    REPLIES_BUTTON +
    ":not([hidden])" +
    "," +
    MORE_REPLIES_BUTTON +
    ":not([hidden])";
  var PAPER_BUTTON = "paper-button";

  var FIRST_COMMENT =
    COMMENTS + "#comments:not([hidden]) " + COMMENT_THREAD + ":not([hidden])";
  var APP = "ytd-app";

  var APPLY = "Apply";
  var LOAD_ALL = "Load All";

  var YCA_FORM = "yca-form";
  var YCA_DATA = "yca-data";
  var YCA_OVERLAY = "yca-overlay";

  var FORCE_STOP_LOADING = false;

  var appEl;
  var info = {};
  var commentsEl;

  function filterMatched(el, filters) {
    var authorMatched = false;
    var searchMatched = false;
    if (filters.author) {
      authorMatched = el
        .querySelector("a#author-text")
        .textContent.toLowerCase()
        .includes(filters.author);
    }
    if (filters.searchRegex) {
      filters.searchRegex.lastIndex = 0;
      var textContent = "";
      el.querySelectorAll("a#author-text,#content-text").forEach(function (el) {
        textContent += " " + el.textContent.trim();
      });
      searchMatched = filters.searchRegex.test(textContent.toLowerCase());
    }
    if (filters.author && filters.searchRegex) {
      if (authorMatched && searchMatched) {
        return true;
      }
    } else if (filters.author) {
      if (authorMatched) {
        return true;
      }
    } else if (filters.searchRegex) {
      if (searchMatched) {
        return true;
      }
    }
    return false;
  }

  function getCommentNodes(fromIndex, filters) {
    var nodes = [];
    commentsEl.querySelectorAll(COMMENT_THREAD).forEach(function (el) {
      applyFilters(el, nodes, filters);
    });
    return nodes.slice(fromIndex || 0);
  }

  var formEl;
  var overlay;

  var form = {
    apply: null,
    search: null,
    author: null,
    loadAll: null,
  };

  function waitToLoad(fn, queryFn) {
    function check() {
      if (queryFn()) {
        clearInterval(timer);
        fn();
      }
    }
    var timer = setInterval(check, 100);
  }

  function getText(el) {
    return el.textContent.trim();
  }

  /**
   *
   * @param {*} el <ytd-comment-renderer />
   */
  function getComment(el) {
    var obj = {};
    try {
      obj.author = getText(el.querySelector("a#author-text"));
      obj.content = getText(el.querySelector("#content-text"));
    } catch (e) {}
    return obj;
  }

  function applyFilters(el, nodes, filters) {
    el.hidden = false;
    if (filters) {
      if (filterMatched(el, filters)) {
        nodes.push(el);
      } else {
        el.hidden = true;
      }
    } else {
      nodes.push(el);
    }
  }

  function getReplyNodes(el, filters) {
    var nodes = [];
    el.querySelectorAll(
      COMMENT_REPLIES + " " + "#loaded-replies" + ">" + COMMENT
    ).forEach(function (el) {
      applyFilters(el, nodes, filters);
    });
    return nodes;
  }

  /**
   *
   * @param {*} el <ytd-comment-thread-renderer />
   */
  function getCommentThread(el, filters) {
    var obj = {};
    try {
      obj = getComment(el.querySelector(COMMENT + "#comment"));
      obj.replies = getReplyNodes(el, filters).map(getComment);
    } catch (e) {}
    return obj;
  }

  function getComments(fromIndex, filters) {
    return getCommentNodes(fromIndex, filters).map(function (el) {
      return getCommentThread(el, filters);
    });
  }

  function getInfo() {
    var obj = {};
    try {
      obj.url = document.URL;
      obj.title = getText(
        appEl.querySelector("h1.title.ytd-video-primary-info-renderer")
      );
      obj.count = Number(
        getText(
          commentsEl.querySelector("ytd-comments-header-renderer #count")
        ).replace(/\D/g, "")
      );
    } catch (e) {}
    return obj;
  }

  function loadReplies() {
    commentsEl.querySelectorAll(VIEW_REPLIES_BUTTON).forEach(function (el) {
      var button = el.querySelector(PAPER_BUTTON);
      if (button) {
        button.click();
      }
    });
  }

  function isEverythingLoaded() {
    return commentsEl.querySelectorAll(VIEW_REPLIES_BUTTON).length === 0;
  }

  function loadComments() {
    window.scrollTo(0, appEl.scrollHeight);
    loadReplies();
    if (!isEverythingLoaded() && !FORCE_STOP_LOADING) {
      setTimeout(loadComments, 100);
    } else {
      if (FORCE_STOP_LOADING) {
        form.loadAll.disabled = true;
      }
      overlay.hidden = true;
    }
  }

  function getData(filters) {
    var obj = Object.assign({}, info);
    obj.comments = getComments(0, filters);
    return obj;
  }

  function makeStyle(width) {
    return "display: flex; width: " + width + "%;";
  }

  function attachForm() {
    var firstEl = commentsEl.querySelector(FIRST_COMMENT);
    formEl = document.createElement("form");
    formEl.classList.add(YCA_FORM);
    formEl.style =
      makeStyle(100) + "justify-content: space-between; margin-bottom: 16px;";
    firstEl.parentElement.insertBefore(formEl, firstEl);

    button = document.createElement("button");
    button.innerText = LOAD_ALL;
    button.style = "width: 12%";
    button.addEventListener("click", function (e) {
      e.preventDefault();
      overlay.hidden = false;
      loadComments();
      e.target.disabled = true;
    });
    form.loadAll = button;
    formEl.appendChild(button);

    var authorInput = document.createElement("input");
    authorInput.style = makeStyle(24);
    authorInput.placeholder = "Search Author name";
    formEl.appendChild(authorInput);
    form.author = authorInput;

    var keyworkInput = document.createElement("textarea");
    keyworkInput.style = makeStyle(44);
    keyworkInput.placeholder = "Search: from hyderabad, india, email";
    formEl.appendChild(keyworkInput);
    form.search = keyworkInput;

    button = document.createElement("button");
    button.innerText = APPLY;
    button.style = "width: 12%";
    button.addEventListener("click", function (e) {
      e.preventDefault();
      fetchData();
    });
    form.apply = button;
    formEl.appendChild(button);

    /**
     * Overlay
     */
    overlay = document.createElement("div");
    overlay.style =
      "width: 100%; height: 100%; position:fixed;" +
      "left:0;right:0;top:0;bottom:0;z-index: 100000001;" +
      "background:rgba(33, 33, 33, 0.9);text-align: center;";
    overlay.classList.add(YCA_OVERLAY);
    overlay.hidden = true;

    var overlayContent = document.createElement("div");
    overlayContent.appendChild(document.createTextNode("Loading comments..."));
    overlayContent.appendChild(document.createElement("br"));
    overlayContent.appendChild(
      document.createTextNode("If you feel it's talking longer, ")
    );
    overlayContent.style = "color: #F1F1F1; padding-top: 40vh;font-size: 18px;";

    var cancelButton = document.createElement("a");
    overlayContent.appendChild(cancelButton);
    cancelButton.href = "javascript:void();";
    cancelButton.innerText = "click here";
    cancelButton.addEventListener("click", function (el) {
      FORCE_STOP_LOADING = true;
    });

    overlayContent.appendChild(document.createTextNode(" to cancel."));
    overlay.appendChild(overlayContent);
    formEl.appendChild(overlay);
    /**
     * END: Overlay
     */
  }

  function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

  function getAppliedFilters() {
    var author = form.author.value;
    var search = form.search.value;
    var obj = {};
    if (author && author.trim()) {
      obj.author = author.trim().toLowerCase();
    }
    if (search && search.trim()) {
      try {
        var keywords = search
          .trim()
          .split(" ")
          .filter((_) => _.trim())
          .map((r) => escapeRegExp(r));
        var regex = new RegExp(keywords.join("|"));
        obj.searchRegex = regex;
      } catch (e) {}
    }
    console.log(obj);
    return obj.author || obj.searchRegex ? obj : null;
  }

  function fetchData() {
    var data = getData(getAppliedFilters());
    removeIfExisting("div." + YCA_DATA);
    var pre = document.createElement("pre");
    pre.innerHTML = JSON.stringify(data, null, 2);
    pre.id = "content-text";
    pre.contentEditable = true;
    pre.classList.add("ytd-comment-renderer");
    pre.style = "border: 1px solid #CCCCCC";
    var wrapper = document.createElement("div");
    wrapper.classList.add(YCA_DATA);
    wrapper.style = "max-height: 100vh; overflow-y:auto;margin: 16px;";
    wrapper.appendChild(pre);
    var firstEl = commentsEl.querySelector(FIRST_COMMENT);
    firstEl.parentElement.insertBefore(wrapper, firstEl);
  }

  function removeIfExisting(query) {
    var existing = commentsEl.querySelector(query);
    if (existing) {
      existing.parentElement.removeChild(existing);
    }
  }

  function _init() {
    appEl = document.querySelector(APP);
    commentsEl = appEl.querySelector(COMMENTS);
    info = getInfo();
    removeIfExisting("form." + YCA_FORM);
    attachForm();
  }

  function init() {
    waitToLoad(_init, function () {
      return document.querySelector(FIRST_COMMENT);
    });
  }

  init();
})();
