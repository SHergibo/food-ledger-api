const Brand = require('./../models/brand.model'),
      Household = require('./../models/household.model'),
      Product = require('./../models/product.model'),
      Historic = require('./../models/historic.model');

exports.brandLogicWhenCreate = async (req, type) => {
  console.log(req.body);
  let brandDB = await Brand.findOne({"brandName.value": req.body.brand.value, householdId : req.body.householdId});
  if (brandDB) {
    if (type === "product") {
      await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct + 1 }, { override: true, upsert: true, new: true });
    } else if (type === "historic") {
      await Brand.findByIdAndUpdate(brandDB._id, { numberOfHistoric: brandDB.numberOfHistoric + 1 }, { override: true, upsert: true, new: true });
    }
  } else {
    const household = await Household.findOne({ householdCode: req.user.householdCode });
    let brandObject = {
      brandName: req.body.brand,
      householdId: household._id
    }

    if (type === "product") {
      brandObject.numberOfProduct = 1;
      brandObject.numberOfHistoric = 0;
    } else if (type === "historic") {
      brandObject.numberOfProduct = 0;
      brandObject.numberOfHistoric = 1;
    }

    brandDB = new Brand(brandObject);
    await brandDB.save();
  }
  return brandDB;
};


exports.brandLogicWhenSwitching = async (req, type) => {
  let productBrand;
  if (type === "product") {
    productBrand = await Historic.findById(req.params.historicId);
  } else if (type === "historic") {
    productBrand = await Product.findById(req.params.productId);
  }

  let brandDB = await Brand.findById(productBrand.brand._id);

  if (type === "product") {
    await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct + 1, numberOfHistoric: brandDB.numberOfHistoric - 1 }, { override: true, upsert: true, new: true });
  } else if (type === "historic") {
    await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct - 1, numberOfHistoric: brandDB.numberOfHistoric + 1 }, { override: true, upsert: true, new: true });
  }

  return;
};

exports.brandLogicWhenUpdate = async (req, type, switching) => {
  let productBrand;
  if (switching) {
    if (type === "product") {
      productBrand = await Historic.findById(req.params.historicId);
    } else if (type === "historic") {
      productBrand = await Product.findById(req.params.productId);
    }
  } else if (!switching) {
    if (type === "product") {
      productBrand = await Product.findById(req.params.productId);
    } else if (type === "historic") {
      productBrand = await Historic.findById(req.params.historicId);
    }
  }


  let brandDB = await Brand.findOne({"brandName.value": req.body.brand.value});
  let oldBrand = await Brand.findById(productBrand.brand);
  if (brandDB) {
    if (!switching) {
      if (type === "product") {
        await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct + 1 }, { override: true, upsert: true, new: true });
        await Brand.findByIdAndUpdate(oldBrand._id, { numberOfProduct: oldBrand.numberOfProduct - 1 }, { override: true, upsert: true, new: true });
      } else if (type === "historic") {
        await Brand.findByIdAndUpdate(brandDB._id, { numberOfHistoric: brandDB.numberOfHistoric + 1 }, { override: true, upsert: true, new: true });
        await Brand.findByIdAndUpdate(oldBrand._id, { numberOfHistoric: oldBrand.numberOfHistoric - 1 }, { override: true, upsert: true, new: true });
      }
    } else {
      if (type === "product") {
        await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct + 1 }, { override: true, upsert: true, new: true });
        await Brand.findByIdAndUpdate(oldBrand._id, { numberOfHistoric: oldBrand.numberOfHistoric - 1 }, { override: true, upsert: true, new: true });
      } else if (type === "historic") {
        await Brand.findByIdAndUpdate(brandDB._id, { numberOfHistoric: brandDB.numberOfHistoric + 1 }, { override: true, upsert: true, new: true });
        await Brand.findByIdAndUpdate(oldBrand._id, { numberOfProduct: oldBrand.numberOfProduct - 1 }, { override: true, upsert: true, new: true });
      }
    }
  } else {
    const household = await Household.findOne({ householdCode: req.user.householdCode });
    let brandObject = {
      brandName: req.body.brand,
      householdId: household._id
    }

    if (type === "product") {
      if(switching){
        await Brand.findByIdAndUpdate(oldBrand._id, { numberOfHistoric: oldBrand.numberOfHistoric - 1 }, { override: true, upsert: true, new: true });
      }else if(!switching){
        await Brand.findByIdAndUpdate(oldBrand._id, { numberOfProduct: oldBrand.numberOfProduct - 1 }, { override: true, upsert: true, new: true });
      }
      brandObject.numberOfProduct = 1;
      brandObject.numberOfHistoric = 0;
    } else if (type === "historic") {
      if(switching){
        await Brand.findByIdAndUpdate(oldBrand._id, { numberOfProduct: oldBrand.numberOfProduct - 1 }, { override: true, upsert: true, new: true });
      }else if(!switching){
        await Brand.findByIdAndUpdate(oldBrand._id, { numberOfHistoric: oldBrand.numberOfHistoric - 1 }, { override: true, upsert: true, new: true });
      }
      brandObject.numberOfProduct = 0;
      brandObject.numberOfHistoric = 1;
    }

    brandDB = new Brand(brandObject);
    await brandDB.save();
  }

  return brandDB;
};

exports.brandLogicWhenDelete = async (req, type) => {
  let productBrand;
  if (type === "product") {
    productBrand = await Product.findById(req.params.productId);
  } else if (type === "historic") {
    productBrand = await Historic.findById(req.params.historicId);
  }

  let brandDB = await Brand.findById(productBrand.brand);

  if (type === "product") {
    await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct - 1 }, { override: true, upsert: true, new: true });
  } else if (type === "historic") {
    await Brand.findByIdAndUpdate(brandDB._id, { numberOfHistoric: brandDB.numberOfHistoric - 1 }, { override: true, upsert: true, new: true });
  }

  return;
};