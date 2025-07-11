@@ .. @@
-require('dotenv').config();
-const express = require("express");
-const cors = require("cors");
-const fs = require("fs");
+import dotenv from 'dotenv';
+import express from 'express';
+import cors from 'cors';
+import fs from 'fs';
+
+dotenv.config();