define([
  "app",

  // Libs
  "backbone",

  //Plugins
  "plugins/jquery.xdomainajax",
  "plugins/toskoy",
  "plugins/speakthai"
],

function(app, Backbone) {

  var Views = {};

  Views.Item = Backbone.View.extend({
    template: "todo/item",

    tagName: "li",

    // The DOM events specific to an item.
    events: {
      "click .check": "toggleDone",
      "dblclick label.todo-content": "edit",
      "click span.todo-destroy": "clear",
      "keypress .todo-input": "updateOnEnter",
      "blur .todo-input": "close"
    },

    serialize: function() {
      return {
        done: this.model.get("done"),
        content: this.model.get("content"),
        me: this.model.get("me"),
        ggt: this.model.get("ggt"),
        thai: this.model.get("thai")
      };
    },

    // The TodoView listens for changes to its model, re-rendering. Since
    // there's a one-to-one correspondence between a **Todo** and a
    // **TodoView** in this app, we set a direct reference on the model for
    // convenience.
    initialize: function() {
      this.model.on("change", function() {
        this.render();
      }, this);

      this.model.on("destroy", function() {
        this.remove();
      }, this);
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      this.$el.addClass("editing");
      this.$("#new-todo").focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
      this.model.save({
        content: this.$(".todo-input").val()
      });

      this.$el.removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) {
        this.close();
      }
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.clear();
    }
  });

  Views.List = Backbone.View.extend({
    tagName: "ul",

    render: function(manage) {
      this.collection.each(function(item) {
        this.insertView(new Views.Item({
          model: item
        }));
      }, this);

      //Default hello message
      this.collection.add({
        content: 'ษวัสดลีร์จ้',
        order: this.collection.first(),
        done: false,
        me: false,
        ggt: 'http://translate.google.com/translate_tts?tl=th&q=' + encodeURIComponent('สวัสดีจ้ะ') + '&---->ถ้าErrorคลิกที่นี่แล้วกดEnter<----',
        thai: 'สวัสดีจ้ะ'
      });

      return manage(this).render();
    },

    initialize: function() {
      this.collection.on("reset", function() {
        this.render();
      }, this);

      this.collection.on("add", function(item) {
        this.insertView(new Views.Item({
          model: item
        })).render();
      }, this);

      'สวัสดีจ้ะ'.speakThai();
    }
  });

  Views.Form = Backbone.View.extend({
    template: "todo/form",

    events: {
      "keypress #new-todo": "createOnEnter",
      "keyup #new-todo": "showTooltip",
      "click .mark-all-done": "toggleAllComplete"
    },

    // If you hit return in the main input field, create new **Todo** model,
    // persisting it to *localStorage*.
    createOnEnter: function(ev) {
      if (ev.keyCode !== 13) {
        return;
      }

      ev.preventDefault();

      //Try send request to simsimi server
      var msg = encodeURIComponent(this.$("#new-todo").val());
      var self = this;
      $.get('http://www.simsimi.com/func/req?lc=th&msg=' + msg, function(data) {
        var json = $.parseJSON($(data.responseText).text().trim());
        self.collection.add(self.reply(json.response.speakThai().toSkoy(), json.response));
        self.scrollToBottom();
      });

      this.collection.add(this.newAttributes());
      this.scrollToBottom();
      this.$("#new-todo").val("");
    },

    scrollToBottom: function() {
      window.scrollTo(0, document.body.scrollHeight);
    },

    // Lazily show the tooltip that tells you to press `enter` to save
    // a new todo item, after one second.
    showTooltip: function(ev) {
      ev.preventDefault();

      var tooltip = this.$(".ui-tooltip-top");
      var val = this.$("#new-todo").val();

      tooltip.fadeOut();

      if (this.tooltipTimeout) {
        clearTimeout(this.tooltipTimeout);
      }

      if (!val || val === this.$("#new-todo").attr("placeholder")) {
        return;
      }

      this.tooltipTimeout = _.delay(function() {
        tooltip.show().fadeIn();
      }, 1000);
    },

    // Generate the attributes for a new Todo item.
    newAttributes: function() {
      return {
        content: this.$("#new-todo").val(),
        order: this.collection.nextOrder(),
        done: false,
        me: true,
        ggt: 'http://translate.google.com/translate_tts?tl=th&q=' + encodeURIComponent(this.$("#new-todo").val()) + '&---->ถ้าErrorคลิกที่นี่แล้วกดEnter<----',
        thai: this.$("#new-todo").val()
      };
    },

    reply: function(msg, thai) {
      return {
        content: msg,
        order: this.collection.nextOrder(),
        done: false,
        me: false,
        ggt: 'http://translate.google.com/translate_tts?tl=th&q=' + encodeURIComponent(thai) + '&---->ถ้าErrorคลิกที่นี่แล้วกดEnter<----',
        thai: thai
      };
    },

    toggleAllComplete: function () {
      var done = this.$(".mark-all-done").is(":checked");

      this.collection.each(function(todo) {
        todo.save({ done: done });
      });
    },

    initialize: function() {
      this.collection.on("all", function() {
        var remaining = this.collection.remaining().length;

        this.$(".mark-all-done").attr("checked", !remaining);
      }, this);
    }
  });

  Views.Stats = Backbone.View.extend({
    // Our template for the line of statistics at the bottom of the app.
    template: "todo/stats",

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "click .todo-clear a": "clearCompleted"
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
    initialize: function() {
      this.collection.on("change", function() {
        this.render();
      }, this);
    },

    serialize: function() {
      var done = this.collection.done().length;
      var remaining = this.collection.remaining().length;

      return {
        total: this.collection.length,
        done: done,
        remaining: remaining
      };
    },

    // Clear all done todo items, destroying their models.
    clearCompleted: function() {
      _.each(this.collection.done(), function(todo){
        todo.clear();
      });

      return false;
    }
  });

  return Views;

});
