const Brand = require('./../models/brand.model'),
      Product = require('./../models/product.model'),
      Historic = require('./../models/historic.model'),
      { socketIoToBrand } = require('./socketIo.helper');

exports.brandLogicWhenCreating = async (req, type) => {
  let brandDB = await Brand.findOne({"brandName.value": req.body.brand.value, householdId : req.body.householdId});
  if (brandDB) {
    let updatedBrand;
    if (type === "product") {
      updatedBrand = await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct + 1 });
    } else if (type === "historic") {
      updatedBrand = await Brand.findByIdAndUpdate(brandDB._id, { numberOfHistoric: brandDB.numberOfHistoric + 1 });
    }
    socketIoToBrand({data : updatedBrand, type : "updatedData", model: Brand});
  } else {
    let brandObject = {
      brandName: req.body.brand,
      householdId: req.body.householdId
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

    socketIoToBrand({data : brandDB, type : "addedData", model: Brand});
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

  let updatedBrand;
  if (type === "product") {
    updatedBrand = await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct + 1, numberOfHistoric: brandDB.numberOfHistoric - 1 });
  } else if (type === "historic") {
    updatedBrand = await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct - 1, numberOfHistoric: brandDB.numberOfHistoric + 1 });
  }

  socketIoToBrand({data : updatedBrand, type : "updatedData", model: Brand});

  return;
};

exports.brandLogicWhenUpdating = async (req, type, switching) => {
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


  let brandDB = await Brand.findOne({"brandName.value": req.body.brand.value, householdId : req.body.householdId});
  let oldBrand = await Brand.findById(productBrand.brand);
  if (brandDB) {
    let updatedNewBrand;
    let updatedOldBrand;
    if (!switching) {
      if (type === "product") {
        updatedNewBrand = await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct + 1 });
        updatedOldBrand = await Brand.findByIdAndUpdate(oldBrand._id, { numberOfProduct: oldBrand.numberOfProduct - 1 });
      } else if (type === "historic") {
        updatedNewBrand = await Brand.findByIdAndUpdate(brandDB._id, { numberOfHistoric: brandDB.numberOfHistoric + 1 });
        updatedOldBrand = await Brand.findByIdAndUpdate(oldBrand._id, { numberOfHistoric: oldBrand.numberOfHistoric - 1 });
      }
    } else {
      if (type === "product") {
        updatedNewBrand = await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct + 1 });
        updatedOldBrand = await Brand.findByIdAndUpdate(oldBrand._id, { numberOfHistoric: oldBrand.numberOfHistoric - 1 });
      } else if (type === "historic") {
        updatedNewBrand = await Brand.findByIdAndUpdate(brandDB._id, { numberOfHistoric: brandDB.numberOfHistoric + 1 });
        updatedOldBrand = await Brand.findByIdAndUpdate(oldBrand._id, { numberOfProduct: oldBrand.numberOfProduct - 1 });
      }
    }

    socketIoToBrand({data : updatedNewBrand, type : "updatedData", model: Brand});
    socketIoToBrand({data : updatedOldBrand, type : "updatedData", model: Brand});

  } else {
    let brandObject = {
      brandName: req.body.brand,
      householdId: req.body.householdId
    }
    let updatedOldBrand;

    if (type === "product") {
      if(switching){
        updatedOldBrand = await Brand.findByIdAndUpdate(oldBrand._id, { numberOfHistoric: oldBrand.numberOfHistoric - 1 });
      }else if(!switching){
        updatedOldBrand = await Brand.findByIdAndUpdate(oldBrand._id, { numberOfProduct: oldBrand.numberOfProduct - 1 });
      }
      brandObject.numberOfProduct = 1;
      brandObject.numberOfHistoric = 0;
    } else if (type === "historic") {
      if(switching){
        updatedOldBrand = await Brand.findByIdAndUpdate(oldBrand._id, { numberOfProduct: oldBrand.numberOfProduct - 1 });
      }else if(!switching){
        updatedOldBrand = await Brand.findByIdAndUpdate(oldBrand._id, { numberOfHistoric: oldBrand.numberOfHistoric - 1 });
      }
      brandObject.numberOfProduct = 0;
      brandObject.numberOfHistoric = 1;
    }

    socketIoToBrand({data : updatedOldBrand, type : "updatedData", model: Brand});

    brandDB = new Brand(brandObject);
    await brandDB.save();

    socketIoToBrand({data : brandDB, type : "addedData", model: Brand});
  }

  return brandDB;
};

exports.brandLogicWhenDeleting = async (req, type) => {
  let productBrand;
  if (type === "product") {
    productBrand = await Product.findById(req.params.productId);
  } else if (type === "historic") {
    productBrand = await Historic.findById(req.params.historicId);
  }

  let brandDB = await Brand.findById(productBrand.brand);

  let updatedBrand;
  if (type === "product") {
    updatedBrand = await Brand.findByIdAndUpdate(brandDB._id, { numberOfProduct: brandDB.numberOfProduct - 1 });
  } else if (type === "historic") {
    updatedBrand = await Brand.findByIdAndUpdate(brandDB._id, { numberOfHistoric: brandDB.numberOfHistoric - 1 });
  }

  socketIoToBrand({data : updatedBrand, type : "updatedData", model: Brand});

  return;
};