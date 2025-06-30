const Listing=require("../models/listing");
// const fetch = require("node-fetch");
const axios = require("axios");



module.exports.index=async (req,res)=>{
    let allListings;
    allListings= await Listing.find({});
    res.render("listings/index.ejs",{allListings});
}

module.exports.renderNewForm=(req,res)=>{
    res.render("listings/new.ejs");
  }

module.exports.showListing=async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id)
    .populate({
        path:"reviews",
        populate:{
            path:"author",
        },
    }).populate("owner"); 
    if(!listing){
        req.flash("error","No such listing exists!");
        return res.redirect("/listings");
    }
    // console.log(listing);
    res.render("listings/show.ejs",{listing,maptilerKey: process.env.MAPTILER_API_KEY})
}

module.exports.createListing=async (req,res,next)=>{
    // console.log(req.body.category);
    let url=req.file.path;
    let filename=req.file.filename;
    let listing=req.body.listing;
    const location = req.body.listing.location;

    // Make request to OpenCage
    const geoResponse = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: {
        q: location,
        key: process.env.OPENCAGE_API_KEY,
        limit: 1
      }
    });
    const coordinates = geoResponse.data.results[0].geometry;
    
    // console.log(coordinates);

    const newListing=new Listing(listing);
    newListing.owner=req.user._id;
    newListing.image={url,filename};

    // Save GeoJSON coordinates
    newListing.geometry = {
      type: "Point",
      coordinates: [coordinates.lng, coordinates.lat]
    };

    let savedListing=await newListing.save();
    // console.log(savedListing);
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
};


module.exports.renderEditForm=async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","No such listing exists!");
        return res.redirect("/listings");
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250")
    res.render("listings/edit.ejs",{listing,originalImageUrl});
}

module.exports.updateListing=async (req,res)=>{
    let {id}=req.params;
    let listing= await Listing.findByIdAndUpdate(id,{...req.body.listing}); //...req.body.listing converts the listing array into single values
    
    if(typeof req.file !== "undefined"){
        let url=req.file.path;
        let filename=req.file.filename;
        listing.image={url,filename};
        await listing.save();
    }

    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing=async (req,res)=>{
   let {id}=req.params;
   let deletedListing=await Listing.findByIdAndDelete(id);
   console.log(deletedListing);
   req.flash("success","Listing Deleted!");
   res.redirect("/listings");
}