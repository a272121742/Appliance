(function(){
  // BaseComponent.kind
  var BASECOMPONENT_NAME = '__BaseComponent__';
  // ApplianceComponent.kind
  var APPLIANCECOMPONENT_NAME = '__ApplianceComponent__';
  // ContainerComponent.kind
  var CONTAINERCOMPONENT_NAME = '__ContainerComponent__';
  // UI.body.kind
  var BODY_NAME = UI.body.kind;

  //给Component进行扩展，Template无法进行拓展，因为Template是Component的实例
  // 获取Appliance组件的上下文Application
  UI.Component.constructor.prototype.getApplication = function(){
    var self = this;
    var appliance = self.kind === APPLIANCECOMPONENT_NAME ? self : self.getParent(APPLIANCECOMPONENT_NAME);
    return appliance ? appliance.Application : null;
  };
  // 获取Container组件的上下文Scope（同getContext）
  UI.Component.constructor.prototype.getScope = function(){
    var self = this;
    var container = self.kind === CONTAINERCOMPONENT_NAME ? self : self.getParent(CONTAINERCOMPONENT_NAME);
    return container ? containerComponent.Scope : null;
  };
  // 获取Container组件的上下文Context（同getScope）
  UI.Component.constructor.prototype.getContext = function(){
    return this.getScope();
  };
  // 获取Appliance组件
  UI.Component.constructor.prototype.getAppliance = function(){
    return this.getParent(APPLIANCECOMPONENT_NAME);
  };
  // 获取Container组件
  UI.Component.constructor.prototype.getContainer = function(){
    return this.getParent(CONTAINERCOMPONENT_NAME);
  };
  // 获取Container上下文的Session
  UI.Component.constructor.prototype.getSession = function(){
    return this.getScope().Session;
  };
  // 获取Appliance上下文的Session
  UI.Component.constructor.prototype.getGlobalSession = function(){
    return this.getScope().Session;
  };
  // 获取当前组件的父组件，可递归向上查找
  UI.Component.constructor.prototype.getParent = function(kind){
    var self = this;
    var parent = self.parent;
    // kind不是字符串，或者父组件不存在，或者 父组件即为所寻组件
    return !_.isString(kind) || !parent || (parent.kind === kind) ? parent : parent.getParent(kind);
  };
  // 判断当前组件是否存在该父组件，可递归向上查找
  UI.Component.constructor.prototype.hasParent = function(kind){
    var self = this;
    return !!self.getParent(kind);
  };
  // 定义BaseComponent组件
  var BaseComponent = UI.Component.extend({
    __helperHost : true ,
    kind : BASECOMPONENT_NAME
  });
  // 定义Application组件
  var ApplianceComponent = (function(){
    // 定义Container列表，以提供跨Container进行操作
    var ContainerList = {};
    return BaseComponent.extend({
      kind : APPLIANCECOMPONENT_NAME,
      init : function(){
        if(!this.hasParent(BODY_NAME)){
          throw new Meteor.Error(10000, '错误的模板书写格式', 'Application必须包裹在body中！');
        }
      },
      render : function(){
        // Meteor.Appliance = this;//如果做测试，可以解开
        return this.__content;
      },
      // 设置Container
      __setContainer__ : function(namespace, container){
        if(ContainerList.hasOwnProperty(namespace)){
          throw new Meteor.Error(10000, '错误的配置方式', 'Container存在重复的namespace');
        }
        ContainerList[namespace] = container;
      },
      // 获取Container
      getContainer : function(namespace){
        return ContainerList[namespace];
      },
      // 根据命名空间查询上下文
      __findScope__ : function(namespace){
        var Container = ContainerList[namespace];
        return Container ? Container.getScope() : null;
      },
      // 根据命名空间查询上下文
      __findContext__ : function(namespace){
        return this.__findScope__(namespace);
      },
      // 根据命名空间查询Session
      __findSession__ : function(namespace){
        var Scope = this.__findScope__(namespace);
        return Scope ? Scope.Session : null;
      }
    });
  })();
  //定义Container组件
  var ContainerComponent = ApplianceComponent.extend({
    kind : CONTAINERCOMPONENT_NAME,
    init : function(){
      if(!this.hasParent(APPLIANCECOMPONENT_NAME)){
        throw new Meteor.Error(10000,'错误的模板书写格式','Container必须包裹在Application中！');
      }
      if(this.hasParent(CONTAINERCOMPONENT_NAME)){
        throw new Meteor.Error(10000,'错误的模板书写格式','Container不能再包裹Container');
      }
    },
    render : function(){
      var self = this;
      var Appliance = self.getAppliance();
      Appliance.__setContainer__(self.Scope.namespace, self);
      return self.__content;
    }
  });
  //注册全局Application-helper
  UI.registerHelper('Appliance',function(){
    var selfConstructor = arguments.callee;
    if(selfConstructor.__initialized__ === true){
      throw new Meteor.Error(10000,'错误的助理使用方式', 'Appliance在整个应用中只能使用一次');
    }
    selfConstructor.__initialized__ = true;
    return ApplianceComponent.extend({
      Application : {
        Session : Session
      }
    });
  });
  //注册全局Container-helper
  UI.registerHelper('Container', function(){
    var Scope = this;
    var namespace = Scope.namespace;
    if(!namespace){
      throw new Meteor.Error(10000,'错误的模板书写格式', '必须配置namespace属性，例如{{> Container namespace=\"myContainer\"}}或者{{#Container namespace=\"myContainer\"}}{{/Container}}');
    }
    Scope.Session = new ReactiveDict();
    return ContainerComponent.extend({
      Scope : Scope,
      Context : Scope
    });
  });
})();