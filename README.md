Application使用说明
====================

##  添加 Appliance Helper

程序中需要有一个`全局的作用域`，因此我们需要一个`Appliance`诞生。但这并不能阻止使用者使用client的其他全局作用域，这样做只是为了书写上具备易读性。

但要注意的是，他的存在需要两个必要条件：

0.  必须在`body`中，第一个直接嵌套，这样是为了避免这个标签被随意使用。
0.  在一个`Meteor`项目实例中，他应该且只应该出现一次，我们做很多的实际项目都应该如此约束。

满足以上要求的Helper写法应该这样：

```html
<body>
  {{#Appliance}}
    <!--添加Container或其他Template-->
  {{/Appliance}}
</body>
```

##  添加 Container Helper

或许我们需要一个容器，来隔离各个页面或者模板的作用域，此时我们就需要在其中添加一个`Container助理`了。他是能被重用，并且可以隔离多个多个作用域空间的，其中的模板或者组件都会共享他所提供的作用域。

他的存在需要三个必要条件：

0.  必须在`Appliance`中，这种写法同样是基于易读性考虑。
0.  `Container`中不能再次嵌套`Container`，否者，这是为了让开发者更加确定上下文所在位置。
0.  `Container`的配置项中需要有一个`namespace属性`，并且这是必须的，但值可以相同。

满足以上要求的Helper写法应该如下所示：

```html
<body>
  {{#Appliance}}
    {{#Container namespace="yourNamespace"}}
      <!--添加其他Template或HTML代码-->
    {{/Container}}
  {{/Appliance}}
</body>
```

##  添加 Template 或 HTML

建议添加`Template`，这样Template的控件将是可控的。如果你还是选择添加`HTML`，最好他不需要与页面进行交互。

这里，我们给出一个完整的事例来展示他的功能：

```html
<body>
  {{#Appliance}}
    {{#Container namespace="t1"}}
      {{> temp1}}
    {{/Container}}
    {{#Container namespace="t2"}}
      {{> temp1}}
    {{/Container}}

    {{> temp2}}
  {{/Appliance}}

  {{> temp3}}
</body>

<template name="temp1">
  <input type="button" value="button"/> {{value}} <br/>
</template>
<template name="temp2">
  <input type="button" value="button"/> {{value}} <br/>
</template>
<template name="temp3">
  <input type="button" value="button"/> {{value}} <br/>
</template>
```

我们这里除了按以上正确步骤添加了`Template.temp1`，还特别的添加了`Template.temp2`和`Template.temp3`。值得注意的是，这三个模板都是一样的，但是为了后面我们区别，我们采用了三种命名，但其实他们都是一样的。

##  获取上下文

获取上下问的途径有三个需求：第一个是`Template.helper`被加载的时候，我们可能要从上下文环境而非全局环境读取数据；第二个是`Template.created`或`Template.rendered`的时候能够获取，从而做一些动态改变；第三个是`Template.events`执行函数中，我们要能够拿到上下文环境。

### helper数据映射时

以temp1为例，使用一个helper数据映射应该这样：

```javascript
Template.temp1.value = function(){
  return Session.get('value');
};
```

但是我们发现`namespace`为t1和t2的两个Container都包含了`Template.temp1`，我们需要为他展示不同的数据，就要在各自的上下文环境中获取。

```javascript
Template.temp1.value = function(){
  var Scope = this;
  return Scope.Session.get('value');
};
```

在helper中，`this`指向当前组件所在`Container`拥有的`Scope属性`。而每个Container是相互区别的，因此取到的值也会不一样。

但是这样的代码使用在`Template.temp2`和`Template.temp3`上的时候，就需要格外注意了！因为他们都不在Container中，所以，`this`对象指向一个`空对象{}`。那么其中就不会有Session的属性存在了。因此代码就不得不改写：

```javascript
Template.temp2.value =
Template.temp3.value = function(){
  //this指向{}，因为他们都没有包含在Container中
  return Session.get('value');
};
```

### Template行为通知函数

当Template已经渲染完成，都会有一个`rendered`的通知函数被激活。这个函数中，官方定义`this`指向当前模板的一个`实例（templateInstance）`。在考核源码时，发现这个实例是一个`直接对象`，非`构造对象`，因此没办法扩展。但这个实例可以找到他的组件原件，需要通过`this.__component__`的方法获取。然后各个Component都是采用对象嵌套的方式组建，因此我们扩展了`UI.Component`的构造函数原型，让他具备获取Scope的方法。

```javascript
Template.temp1.rendered = function(){
  var component = this.__component__;
  var Scope = component.getScope();
  if(Scope.namespace === 't1'){
    Scope.Session.setDefault('value',1);
  }
  if(Scope.namespace === 't2'){
    Scope.Session.setDefault('value',-1);
  }
};
```

这样，两个不同的Container中的相同模板就具备不同的数据，而且他们是相互隔离的。这对于初始化数据时，做动态化和数据区别是非常有帮助的。当然也有需要注意的地方，只有在Container中的模板才能使用`getScope()`方法。除了这个方法，还有扩展其他下方法，全部的方法如下：

####  getScope() / getContext()

获取组件（`Component`）所在容器（`Container`）的上下文（`Scope`）。如果组件确实是包裹在容器中的，那么就一定会有，反之返回`null`。以上示例中，`Template.temp2`和`Template.temp3`获取的上下文都是`null`。

####  getApplication()

获取组件（`Component`）所在全局环境（`Appliance`）的上下文（`Application`）。如果组件确实是包裹在容器中的，那么就一定会有，反之返回`null`。以上示例中，`Template.temp3`获取的全局上下文是`null`。

####  getParent([String parentKind])

获取组件（`Component`）的`父组件`，如果什么参数都不传，默认是这样的。如果传入一个父组件名称（`parentKind`），则会向上`递归查找`。如果没有父组件或者找不到该名称的父组件，都会返回`null`。

####  hasParent([String parentKind])

同`getParent([String parentKind])`，仅仅是对父组件存在性的一个判断。

####  getContainer()

获取组件（`Component`）所在容器（`Container`）。如果没有容器，返回`null`。

#### getAppliance()

获取组件（`Component`）所在全局环境（`Appliance`）。如果没有，返回`null`。

#### getSession()

获取组件（`Component`）所在容器（`Container`）的上下文（`Scope`）的Session对象。

#### getGlobalSession()

获取组件（`Component`）所在全局环境（`Appliance`）的上下文（`Application`）的Session对象，也就是全局的Session。

### Template事件监听

如果是采用`Meteor的事件监听方式`，那么回调函数中将会被注入两个参数（原生监听方法不会有第二个参数）。一个是`jQuery.Event`，另一个就是`templateInstance`。能拿到模板实例，就能够获取上下文。然后我们可以做如下的事情：

```javascript
Template.temp1.events(function(event, templateInstance){
  var Scope = templateInstance.__component__.getScope();
  var value = Scope.Session.get('value');
  if(Scope.namespace === 't1'){
    Scope.Session.set('value', value + 1);
  }
  if(Scope.namespace === 't2'){
    Scope.Session.set('value', value - 1);
  }
});
```

如此这样，两个同一模板制造的按钮，就具备了不同功能（一个做加法，一个做减法）。同样的，这个templateInstance对应Component也会有扩展的方法，是否能获取到值取决于模板是否在Container或Application中。


