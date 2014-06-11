(function(){
  var BASECOMPONENT_NAME = '__BaseComponent__';
  var APPLICATIONCOMPONENT_NAME = '__ApplicationComponent__';
  var CONTAINERCOMPONENT_NAME = '__ContainerComponent__';
  var BODY_NAME = UI.body.kind;

  //给Component进行扩展，Template无法进行拓展，因为Template是Component的实例
  UI.Component.constructor.prototype.getApplication = function(){
    var self = this;
    var applicationComponent = self.getParent(APPLICATIONCOMPONENT_NAME);
    return applicationComponent ? applicationComponent.Application : null;
  };

  UI.Component.constructor.prototype.getScope = function(){
    var self = this;
    var containerComponent = self.getParent(CONTAINERCOMPONENT_NAME);
    return containerComponent ? containerComponent.Scope : null;
  };

  UI.Component.constructor.prototype.getParent = function(kind){
    var self = this;
    var parent = self.parent;
    //kind不是字符串 或者 父组件不存在 或者 父组件即为所寻组件
    return !_.isString(kind) || !parent || (parent.kind === kind) ? parent : parent.getParent(kind);
  };
  
  UI.Component.constructor.prototype.hasParent = function(kind){
    var self = this;
    return !!self.getParent(kind);
  };
  // //定义基础组件
  var BaseComponent = UI.Component.extend({
    __helperHost : true ,
    kind : BASECOMPONENT_NAME
  });
  //定义Application组件
  var ApplicationComponent = BaseComponent.extend({
    kind : APPLICATIONCOMPONENT_NAME,
    init : function(){
      if(!this.hasParent(BODY_NAME)){
        throw new Meteor.Error(10000, '错误的模板书写格式', 'Application必须包裹在body中！');
      }
    },
    render : function(){
      return this.__content;
    }
  });
  //定义Container组件
  var ContainerComponent = ApplicationComponent.extend({
    kind : CONTAINERCOMPONENT_NAME,
    init : function(){
      if(!this.hasParent(APPLICATIONCOMPONENT_NAME)){
        throw new Meteor.Error(10000,'错误的模板书写格式','Container必须包裹在Application中！');
      }
      if(this.hasParent(CONTAINERCOMPONENT_NAME)){
        throw new Meteor.Error(10000,'错误的模板书写格式','Container不能再包裹Container');
      }
    },
    render : function(){
      return this.__content;
    }
  });
  //注册全局Application助理
  UI.registerHelper('Application',function(){
    var selfConstructor = arguments.callee;
    if(selfConstructor.__initialized__ === true){
      throw new Meteor.Error(10000,'错误的助理使用方式', 'Application在整个应用中只能使用一次');
    }
    selfConstructor.__initialized__ = true;
    return ApplicationComponent.extend({Application : {name : APPLICATIONCOMPONENT_NAME, Session : Session}});
  });
  //注册全局Container助理
  UI.registerHelper('Container', function(){
    var Scope = this;
    var namespace = Scope.namespace;
    if(!namespace){
      throw new Meteor.Error(10000,'错误的模板书写格式', '必须配置namespace属性，例如{{> Container namespace=\"myContainer\"}}或者{{#Container namespace=\"myContainer\"}}{{/Container}}');
    }
    Scope.Session = new ReactiveDict();
    return ContainerComponent.extend({Scope : Scope});
  });
})();