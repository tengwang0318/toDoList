const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const {model} = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin:admin@cluster0.ydaw6l9.mongodb.net/?retryWrites=true&w=majority");

console.log(mongoose.connection.readyState);

const itemSchema = {
    name: String,
};
const Item = mongoose.model("item", itemSchema);
const item1 = new Item({"name": "SLEEP"});
const item2 = new Item({"name": "EAT"});
const item3 = new Item({"name": "Play"});

const defaultItems = [item1, item2, item3];

const ListSchema = {
    name: String, items: [itemSchema],
}

const List = mongoose.model("List", ListSchema);

app.get("/", function (req, res) {
    Item.find({})
        .then(function (foundItems) {
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems)
                    .then(function () {
                        console.log("Successfully saved the data into DB.");
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
                res.redirect("/");
            } else {
                res.render("list", {listTitle: "Today", newListItems: foundItems});
            }
        })
        .catch(function (err) {
            console.log(err);
        })
});


app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName})
            .then(function (foundList) {
                // console.log(foundList);
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(function (err) {
                console.log(err);
            })
    }

});
app.post("/delete", function (req, res) {
    const listName = req.body.listName;
    const checkedItemID = req.body.checkbox;
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemID)
            .then(function () {
                console.log("Successfully Delete!");
                res.redirect("/");
            })
            .catch(function (err) {
                console.log(err);
            });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}})
            .then(function () {
                res.redirect("/" + listName);
            })
            .catch(err => {
                console.log(err);
            });
    }
});
app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.find({name: customListName})
        .then(function (foundList) {
            if (foundList.length === 0) {
                const list = new List({
                    name: customListName, items: defaultItems,
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", {listTitle: foundList[0].name, newListItems: foundList[0].items});
            }

        })
        .catch(function (err) {
            console.log(err);
        });


});

app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
