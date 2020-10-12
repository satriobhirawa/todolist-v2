//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// 1
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// 2
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

// 3 Schema
const itemsSchema = new mongoose.Schema({
  name: String
})

// 4 Model
const Item = mongoose.model("Item", itemsSchema);

// 5
const Eat = new Item({
  name: "Eat"
});

const Sleep = new Item({
  name: "Sleep"
});

const Bath = new Item({
  name: "Bath"
});

// INSERT to DB
const defaultItems = [Sleep, Bath, Eat];

//List schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {



  // READ & ADD while checking
  Item.find({}, function(err,foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully");
        }
      });
      //show the items back
      res.redirect("/");
    }else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    //to show the item back
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }



});

//route delete
app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  //to submit checkbox hiddenly
  const listName = req.body.listName;

    //delete checkbox
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Succesfully deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }



});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
//find me a list inside collection of the list that has a name of the list that user trying to access
List.findOne({name: customListName}, function(err, foundList){
  if (!err) {
    if (!foundList) {
      //Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      //show existing list
      res.render("List", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
})



});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
