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

  var app;
  var info = {};
  var comments;
  var allCommentsLoaded = false;

  function getCommentNodes(fromIndex) {
    return Array.from(document.querySelectorAll(COMMENT_THREAD)).slice(
      fromIndex || 0
    );
  }

  var container;

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
        document.querySelector("h1.title.ytd-video-primary-info-renderer")
      );
      var commentsEl = document.querySelector(COMMENTS + "#comments");
      obj.count = Number(
        getText(
          commentsEl.querySelector("ytd-comments-header-renderer #count")
        ).replace(/\D/g, "")
      );
    } catch (e) {}
    return obj;
  }

  function loadReplies() {
    comments.querySelectorAll(VIEW_REPLIES_BUTTON).forEach(function (el) {
      var button = el.querySelector(PAPER_BUTTON);
      if (button) {
        button.click();
      }
    });
    waitToLoad(loadReplies, function () {
      return comments.querySelectorAll(VIEW_REPLIES_BUTTON).length > 0;
    });
  }

  var appScrollHeight = 0;

  function loadComments() {
    window.scrollTo(0, app.scrollHeight);
    waitToLoad(
      function () {
        if (!allCommentsLoaded) {
          loadComments();
          loadReplies();
          if (appScrollHeight !== app.scrollHeight) {
            appScrollHeight = app.scrollHeight;
          } else {
            allCommentsLoaded = true;
            form.button.disabled = false;
          }
        }
      },
      function () {
        return (
          allCommentsLoaded ||
          document.querySelectorAll(COMMENT).length <= info.count
        );
      }
    );
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
    var firstEl = document.querySelector(FIRST_COMMENT);
    container = document.createElement("div");
    container.classList.add("yca");
    container.style =
      makeStyle(100) + "justify-content: space-between; margin-bottom: 16px;";
    firstEl.parentElement.insertBefore(container, firstEl);

    var button = document.createElement("button");
    button.innerText = "Load All";
    button.style = "width: 14%";
    button.addEventListener("click", function (e) {
      loadComments();
    });
    container.appendChild(button);

    var authorInput = document.createElement("input");
    authorInput.style = makeStyle(24);
    authorInput.placeholder = "Search Author name";
    container.appendChild(authorInput);
    form.author = authorInput;

    var keyworkInput = document.createElement("textarea");
    keyworkInput.style = makeStyle(44);
    keyworkInput.placeholder = "Search: from hyderabad, india, email";
    container.appendChild(keyworkInput);
    form.input = keyworkInput;

    button = document.createElement("button");
    button.innerText = "Apply";
    button.style = "width: 14%";
    button.addEventListener("click", function (e) {
      var data = getData();
      var pre = document.createElement("pre");
      pre.innerHTML = JSON.stringify(data, null, 2);
      pre.id = "content-text";
      pre.classList.add("ytd-comment-renderer");
      pre.style = "border: 1px solid #CCCCCC";
      firstEl.parentElement.insertBefore(pre, firstEl);
    });
    button.disabled = true;
    form.button = button;

    container.appendChild(button);
  }

  function _init() {
    debugger;
    app = document.querySelector(APP);
    comments = document.querySelector(COMMENTS);
    info = getInfo();
    var existing = comments.querySelector("div.yca");
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
