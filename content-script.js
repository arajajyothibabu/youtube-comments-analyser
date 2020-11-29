(function () {
  var COMMENTS = "ytd-comments";
  var COMMENT_THREAD = "ytd-comment-thread-renderer";
  var COMMENT = "ytd-comment-renderer";
  var EXPANDER = "ytd-expander";
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

  var FIRST_COMMENT = COMMENTS + "#comments " + COMMENT_THREAD;
  var APP = "ytd-app";

  var APPLY = "Apply";
  var LOAD_ALL = "Load All";

  var appEl;
  var info = {};
  var commentsEl;

  function getCommentNodes(fromIndex) {
    return Array.from(commentsEl.querySelectorAll(COMMENT_THREAD)).slice(
      fromIndex || 0
    );
  }

  var formEl;

  var form = {
    button: null,
    input: null,
    author: null,
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
      obj.content = getText(el.querySelector(EXPANDER + " " + "#content-text"));
    } catch (e) {}
    return obj;
  }

  /**
   *
   * @param {*} el <ytd-comment-thread-renderer />
   */
  function getCommentThread(el) {
    var obj = {};
    try {
      obj = getComment(el.querySelector(COMMENT + "#comment"));
      obj.replies = Array.from(
        el.querySelectorAll(
          COMMENT_REPLIES + " " + "#loaded-replies" + ">" + COMMENT
        )
      ).map(getComment);
    } catch (e) {}
    return obj;
  }

  function getComments(fromIndex) {
    return getCommentNodes(0).map(getCommentThread);
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
    if (!isEverythingLoaded()) {
      setTimeout(loadComments, 100);
    } else {
      form.button.disabled = false;
    }
  }

  function getData() {
    var obj = Object.assign({}, info);
    obj.comments = getComments(0);
    return obj;
  }

  function makeStyle(width) {
    return "display: flex; width: " + width + "%;";
  }

  function attachForm() {
    var firstEl = commentsEl.querySelector(FIRST_COMMENT);
    formEl = document.createElement("form");
    formEl.classList.add("yca");
    formEl.style =
      makeStyle(100) + "justify-content: space-between; margin-bottom: 16px;";
    firstEl.parentElement.insertBefore(formEl, firstEl);

    var authorInput = document.createElement("input");
    authorInput.style = makeStyle(24);
    authorInput.placeholder = "Search Author name";
    formEl.appendChild(authorInput);
    form.author = authorInput;

    var keyworkInput = document.createElement("textarea");
    keyworkInput.style = makeStyle(54);
    keyworkInput.placeholder = "Search: from hyderabad, india, email";
    formEl.appendChild(keyworkInput);
    form.input = keyworkInput;

    button = document.createElement("button");
    button.innerText = LOAD_ALL;
    button.style = "width: 14%";
    button.addEventListener("click", function (e) {
      e.preventDefault();
      if (e.target.innerText === LOAD_ALL) {
        e.target.disabled = true;
        e.target.innerText = APPLY;
        loadComments();
      } else {
        attachData();
      }
    });
    form.button = button;
    formEl.appendChild(button);
  }

  function attachData() {
    var data = getData();
    var pre = document.createElement("pre");
    pre.innerHTML = JSON.stringify(data, null, 2);
    pre.id = "content-text";
    pre.classList.add("ytd-comment-renderer");
    pre.style = "border: 1px solid #CCCCCC";
    var wrapper = document.createElement("div");
    wrapper.style = "max-height: 100vh; overflow-y:auto;margin: 16px;";
    wrapper.appendChild(pre);
    var firstEl = commentsEl.querySelector(FIRST_COMMENT);
    firstEl.parentElement.insertBefore(wrapper, firstEl);
  }

  function _init() {
    appEl = document.querySelector(APP);
    commentsEl = appEl.querySelector(COMMENTS);
    info = getInfo();
    var existing = commentsEl.querySelector("form.yca");
    if (existing) {
      existing.parentElement.removeChild(existing);
    }
    attachForm();
  }

  function init() {
    waitToLoad(_init, function () {
      return document.querySelector(FIRST_COMMENT);
    });
  }

  init();
})();
