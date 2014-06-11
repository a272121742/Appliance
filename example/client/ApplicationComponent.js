//初始化可以获取Application和Container
Template.temp1.rendered = function(){
  console.log('模板加载完毕');
  console.log('模板加载完毕 -- > 获取当前上下文', this.__component__.getScope());
  console.log('模板加载完毕 -- > 获取全局上下文', this.__component__.getApplication());

  //处理不同的业务逻辑
  var Scope = this.__component__.getScope();
  if(Scope.namespace === 't1'){
    Scope.Session.set('value' , 1);
  }else if(Scope.namespace === 't2'){
    Scope.Session.set('value' , 1000);
  }
};
//helper初始化只能找到Container的Scope
Template.temp1.value = function(){
  console.log('加载Helper -- > 获取当前上下文', this);

  //业务逻辑
  return this.Session.get('value');
};
//事件可以获取Application和Scope
Template.temp1.events({
  'click :button' : function(e,t){
    console.log('模板元素事件触发');
    console.log('模板元素事件触发 -- > 获取当前上下文', t.__component__.getScope());
    console.log('模板元素事件触发 -- > 获取全局上下文', t.__component__.getApplication());

    //处理不同的业务逻辑
    var Scope = t.__component__.getScope();
    if(Scope.namespace === 't1'){
      var value = Scope.Session.get('value') + 1;
      Scope.Session.set('value', value);
    }else if(Scope.namespace === 't2'){
      var value = Scope.Session.get('value') -1;
      Scope.Session.set('value', value);
    }
  }
});


